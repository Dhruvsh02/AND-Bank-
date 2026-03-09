from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name='BankAccount',
            fields=[
                ('id',              models.UUIDField(primary_key=True, serialize=False)),
                ('user_id',         models.UUIDField(db_index=True)),
                ('account_number',  models.CharField(max_length=20, unique=True, db_index=True)),
                ('account_type',    models.CharField(max_length=20, default='savings')),
                ('balance',         models.DecimalField(decimal_places=2, default=0.0, max_digits=15)),
                ('upi_id',          models.CharField(blank=True, max_length=100, null=True, unique=True)),
                ('branch',          models.CharField(max_length=100, default='Mumbai Main')),
                ('ifsc_code',       models.CharField(max_length=11, default='ANDB0001001')),
                ('branch_code',     models.CharField(max_length=10, default='ANDB001')),
                ('status',          models.CharField(max_length=20, default='active')),
                ('is_primary',      models.BooleanField(default=True)),
                ('interest_rate',   models.DecimalField(decimal_places=2, default=3.5, max_digits=5)),
                ('daily_txn_limit', models.DecimalField(decimal_places=2, default=500000.0, max_digits=15)),
                ('created_at',      models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at',      models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'bank_accounts', 'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='KYCDetail',
            fields=[
                ('id',                  models.UUIDField(primary_key=True, serialize=False)),
                ('user_id',             models.UUIDField(unique=True, db_index=True)),
                ('pan_number',          models.CharField(max_length=10, unique=True)),
                ('aadhar_number',       models.CharField(max_length=12)),
                ('date_of_birth',       models.DateField()),
                ('address',             models.TextField()),
                ('verification_status', models.CharField(max_length=20, default='pending')),
                ('verified_at',         models.DateTimeField(blank=True, null=True)),
                ('verified_by',         models.UUIDField(blank=True, null=True)),
                ('rejection_reason',    models.TextField(blank=True)),
                ('created_at',          models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at',          models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'kyc_details'},
        ),
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id',         models.UUIDField(primary_key=True, serialize=False)),
                ('user_id',    models.UUIDField(unique=True, db_index=True)),
                ('photo',      models.ImageField(blank=True, null=True, upload_to='profile_photos/')),
                ('email',      models.EmailField()),
                ('phone',      models.CharField(max_length=20)),
                ('first_name', models.CharField(max_length=100)),
                ('last_name',  models.CharField(max_length=100)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'user_profiles'},
        ),
        migrations.AddIndex(
            model_name='bankaccount',
            index=models.Index(fields=['user_id', 'status'], name='bank_acc_user_status_idx'),
        ),
        migrations.AddIndex(
            model_name='bankaccount',
            index=models.Index(fields=['account_number'], name='bank_acc_number_idx'),
        ),
    ]