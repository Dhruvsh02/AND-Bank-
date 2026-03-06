from rest_framework import serializers
from .models import Account


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = [
            'id', 'user_id', 'account_number', 'account_type',
            'balance', 'upi_id', 'ifsc_code', 'branch',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'account_number', 'upi_id', 'created_at', 'updated_at']


class AccountSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for dashboard"""
    class Meta:
        model = Account
        fields = ['account_number', 'account_type', 'balance', 'upi_id', 'ifsc_code', 'status']