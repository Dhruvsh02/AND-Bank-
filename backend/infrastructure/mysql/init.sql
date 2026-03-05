-- AND Bank MySQL Init Script
SET NAMES utf8mb4;

-- Create all service databases
CREATE DATABASE IF NOT EXISTS andbank_auth_service        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS andbank_user_service        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS andbank_transaction_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS andbank_loan_service        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS andbank_card_service        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS andbank_notification_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS andbank_admin_service       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS andbank_chat_service        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SELECT 'AND Bank: All databases created successfully' AS status;
