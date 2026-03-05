from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    first_name     = serializers.CharField(min_length=2, max_length=100)
    last_name      = serializers.CharField(min_length=2, max_length=100)
    email          = serializers.EmailField()
    phone          = serializers.CharField(max_length=20)
    date_of_birth  = serializers.DateField()
    address        = serializers.CharField(min_length=10)
    pan_number     = serializers.RegexField(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', error_messages={'invalid': 'Invalid PAN number format.'})
    aadhar_number  = serializers.RegexField(r'^\d{12}$', error_messages={'invalid': 'Aadhar must be 12 digits.'})
    account_type   = serializers.ChoiceField(choices=['savings', 'current'], default='savings')
    otp_channel    = serializers.ChoiceField(choices=['email', 'sms'], default='email')
    password       = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def validate_phone(self, value):
        clean = value.replace(' ', '').replace('-', '')
        if User.objects.filter(phone=clean).exists():
            raise serializers.ValidationError('An account with this phone number already exists.')
        return clean

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_date_of_birth(self, value):
        from datetime import date
        age = (date.today() - value).days // 365
        if age < 18:
            raise serializers.ValidationError('You must be at least 18 years old to open an account.')
        return value


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()   # email OR account number
    password   = serializers.CharField(write_only=True, style={'input_type': 'password'})


class OTPVerifySerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    otp     = serializers.RegexField(r'^\d{6}$', error_messages={'invalid': 'OTP must be exactly 6 digits.'})


class ResendOTPSerializer(serializers.Serializer):
    user_id  = serializers.UUIDField()
    channel  = serializers.ChoiceField(choices=['email', 'sms'], required=False)
    purpose  = serializers.ChoiceField(
        choices=['login', 'register', 'password_reset'],
        default='login'
    )


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'phone', 'first_name', 'last_name',
            'full_name', 'role', 'status', 'is_verified',
            'is_kyc_verified', 'otp_channel', 'created_at',
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.full_name
