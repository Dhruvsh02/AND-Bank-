import jwt
import requests
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Account
from .serializers import AccountSerializer, AccountSummarySerializer


def get_user_id_from_request(request):
    """Extract user_id from JWT token"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.SIMPLE_JWT['SIGNING_KEY'], algorithms=['HS256'])
        return payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


@api_view(['GET'])
def get_my_account(request):
    """Get account details for the logged-in user"""
    user_id = get_user_id_from_request(request)
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        account = Account.objects.get(user_id=user_id)
        serializer = AccountSerializer(account)
        return Response(serializer.data)
    except Account.DoesNotExist:
        return Response({'error': 'Account not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def get_dashboard_summary(request):
    """Dashboard summary: account + transaction totals"""
    user_id = get_user_id_from_request(request)
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        account = Account.objects.get(user_id=user_id)
    except Account.DoesNotExist:
        return Response({'error': 'Account not found'}, status=status.HTTP_404_NOT_FOUND)

    # Call transaction service internally
    total_in = 0
    total_out = 0
    recent_transactions = []
    transaction_count = 0
    upi_count = 0

    try:
        txn_response = requests.get(
            f"{settings.TRANSACTION_SERVICE_URL}/api/transactions/summary/",
            headers={'Authorization': request.headers.get('Authorization')},
            timeout=3
        )
        if txn_response.status_code == 200:
            txn_data = txn_response.json()
            total_in = txn_data.get('total_in', 0)
            total_out = txn_data.get('total_out', 0)
            recent_transactions = txn_data.get('recent', [])
            transaction_count = txn_data.get('count', 0)
            upi_count = txn_data.get('upi_count', 0)
    except requests.RequestException:
        pass  # Return zeros if transaction service is down

    return Response({
        'account': AccountSummarySerializer(account).data,
        'total_in': total_in,
        'total_out': total_out,
        'transaction_count': transaction_count,
        'upi_count': upi_count,
        'recent_transactions': recent_transactions,
    })


@api_view(['POST'])
def create_account(request):
    """Called by auth service after user registration"""
    # This endpoint should only be called internally (use a shared secret)
    secret = request.headers.get('X-Internal-Secret')
    if secret != settings.INTERNAL_SERVICE_SECRET:
        return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    user_id = request.data.get('user_id')
    username = request.data.get('username', '')

    if Account.objects.filter(user_id=user_id).exists():
        return Response({'message': 'Account already exists'}, status=status.HTTP_200_OK)

    account = Account.objects.create(user_id=user_id)
    account.upi_id = f"{username.lower()}@andbank"
    account.save()

    return Response(AccountSerializer(account).data, status=status.HTTP_201_CREATED)