import uuid, logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import ChatMessage

logger = logging.getLogger(__name__)

def get_user_id(request):
    return getattr(request, 'user_id', None) or request.headers.get('X-User-Id')

# Banking-focused rule-based responses for common questions
RESPONSES = {
    'balance':      'Your current balance is shown on your Dashboard. Go to Dashboard → Balance or the main card on the dashboard.',
    'transfer':     'To transfer money: go to Transfer → enter recipient account/UPI → choose amount → select mode (IMPS/NEFT/RTGS/UPI) → confirm.',
    'upi':          'Your UPI ID is shown on the Dashboard and Balance pages. You can copy it or show your QR code under UPI section.',
    'loan':         'We offer Personal (10.5%), Home (8.5%), Car (9%) and Education (7.5%) loans. Go to Loans → Apply to start an application.',
    'statement':    'Full transaction history is available under Statement. You can filter by date, mode, and type.',
    'otp':          'OTP is sent to your registered email or mobile. In development, use 000000 as the OTP.',
    'password':     'To change your password, go to Profile → Change Password section.',
    'kyc':          'KYC verification is done automatically during registration. Contact support if you face issues.',
    'imps':         'IMPS is instant 24x7 with ₹5 charges, limit ₹5 lakh per transaction.',
    'neft':         'NEFT is processed in batches (2-4 hours), ₹2.50 charges, no upper limit.',
    'rtgs':         'RTGS is instant, minimum ₹2 lakh, ₹25 charges, no upper limit.',
    'interest':     'Savings account earns 3.5% per annum interest, credited quarterly.',
    'charges':      'IMPS: ₹5 | NEFT: ₹2.50 | RTGS: ₹25 | UPI: Free',
    'block':        'To block your card, go to Cards section or contact support at 1800-AND-BANK.',
    'support':      'Contact AND Bank support: Email support@andbank.com | Phone: 1800-AND-BANK (Mon-Sat 9am-6pm)',
    'hours':        'AND Bank customer support is available Monday to Saturday, 9 AM to 6 PM IST.',
}

def get_bot_reply(message):
    msg = message.lower()
    for keyword, reply in RESPONSES.items():
        if keyword in msg:
            return reply
    return (
        "I can help you with: balance enquiry, money transfers, UPI payments, loans, "
        "account statements, transaction charges, and general banking queries. "
        "What would you like to know?"
    )

class ChatMessageView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id    = get_user_id(request)
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)

        message    = request.data.get('message', '').strip()
        session_id = request.data.get('session_id') or str(uuid.uuid4())

        if not message:
            return Response({'detail': 'Message is required'}, status=400)
        if len(message) > 1000:
            return Response({'detail': 'Message too long'}, status=400)

        # Save user message
        ChatMessage.objects.create(
            user_id=user_id, session_id=session_id, role='user', content=message
        )

        # Generate reply
        reply = get_bot_reply(message)

        # Save assistant reply
        ChatMessage.objects.create(
            user_id=user_id, session_id=session_id, role='assistant', content=reply
        )

        return Response({'reply': reply, 'session_id': session_id})

class ChatHistoryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user_id    = get_user_id(request)
        if not user_id:
            return Response({'detail': 'Unauthorized'}, status=401)
        session_id = request.query_params.get('session_id')
        qs = ChatMessage.objects.filter(user_id=user_id)
        if session_id:
            qs = qs.filter(session_id=session_id)
        data = [{'role': m.role, 'content': m.content, 'created_at': m.created_at.isoformat()} for m in qs[:100]]
        return Response({'messages': data})
