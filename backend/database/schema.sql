-- DM Panda clone — MySQL / MariaDB schema (XAMPP port 3306)
CREATE DATABASE IF NOT EXISTS dmpanda CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dmpanda;

-- ---------------------------------------------------------------------------
-- Users & auth
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL DEFAULT '',
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  verify_token VARCHAR(64) NULL,
  reset_token VARCHAR(64) NULL,
  reset_expires DATETIME NULL,
  plan_code VARCHAR(32) NOT NULL DEFAULT 'free',
  plan_expires_at DATETIME NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  status ENUM('active','blocked','deleted') NOT NULL DEFAULT 'active',
  avatar_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  token CHAR(64) PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_sessions_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Plans (seeded from live pricing API)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plan_code VARCHAR(32) NOT NULL,
  name VARCHAR(80) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  button_text VARCHAR(60) NOT NULL DEFAULT 'Choose Plan',
  is_popular TINYINT(1) NOT NULL DEFAULT 0,
  is_custom TINYINT(1) NOT NULL DEFAULT 0,
  price_monthly_inr INT NOT NULL DEFAULT 0,
  price_yearly_inr INT NOT NULL DEFAULT 0,
  price_yearly_monthly_inr INT NOT NULL DEFAULT 0,
  duration_days_monthly INT NOT NULL DEFAULT 30,
  duration_days_yearly INT NOT NULL DEFAULT 364,
  yearly_bonus VARCHAR(255) NOT NULL DEFAULT '',
  actions_per_hour_limit VARCHAR(32) NOT NULL DEFAULT '100',
  actions_per_day_limit VARCHAR(32) NOT NULL DEFAULT '100',
  actions_per_month_limit VARCHAR(32) NOT NULL DEFAULT '1000',
  feature_items JSON NULL,
  comparison JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_plans_code (plan_code)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Instagram accounts & automations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  ig_user_id VARCHAR(64) NOT NULL,
  username VARCHAR(80) NOT NULL DEFAULT '',
  account_type VARCHAR(40) NOT NULL DEFAULT 'BUSINESS',
  status ENUM('active','expired','revoked') NOT NULL DEFAULT 'active',
  access_token TEXT NULL,
  connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_ig_user (user_id, ig_user_id),
  CONSTRAINT fk_ig_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS automations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  ig_account_id INT UNSIGNED NULL,
  type VARCHAR(40) NOT NULL,
  name VARCHAR(160) NOT NULL DEFAULT '',
  keyword VARCHAR(190) NOT NULL DEFAULT '',
  trigger_mode VARCHAR(40) NOT NULL DEFAULT 'keyword',
  reply_text TEXT NULL,
  public_reply TEXT NULL,
  media_url VARCHAR(500) NOT NULL DEFAULT '',
  buttons JSON NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  stats JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_auto_user_type (user_id, type),
  CONSTRAINT fk_auto_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_auto_ig FOREIGN KEY (ig_account_id) REFERENCES instagram_accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS super_profiles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  slug VARCHAR(80) NOT NULL,
  bio TEXT NULL,
  links JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_sp_user (user_id),
  UNIQUE KEY uniq_sp_slug (slug),
  CONSTRAINT fk_sp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Billing & support
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  plan_code VARCHAR(32) NOT NULL DEFAULT '',
  plan_name VARCHAR(80) NOT NULL DEFAULT '',
  amount INT NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'INR',
  method VARCHAR(40) NOT NULL DEFAULT 'UPI',
  payment_id VARCHAR(120) NOT NULL DEFAULT '',
  status ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_tx_user (user_id),
  CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS support_tickets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('open','pending','resolved') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_tk_user (user_id),
  CONSTRAINT fk_tk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  subject VARCHAR(200) NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  status ENUM('new','read','replied') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Blog / playbooks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_posts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(190) NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NULL,
  content MEDIUMTEXT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'Instagram Automation',
  cover_image VARCHAR(500) NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('draft','published') NOT NULL DEFAULT 'published',
  published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_post_slug (slug),
  KEY idx_post_cat (category)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Dashboard counters (simple per-user daily stats)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_stats (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  stat_day DATE NOT NULL,
  messages_sent INT NOT NULL DEFAULT 0,
  comments_handled INT NOT NULL DEFAULT 0,
  UNIQUE KEY uniq_daily (user_id, stat_day),
  CONSTRAINT fk_ds_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Automation delivery log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automation_events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  automation_id INT UNSIGNED NULL,
  event_type VARCHAR(40) NOT NULL DEFAULT '',
  recipient_id VARCHAR(64) NOT NULL DEFAULT '',
  status ENUM('sent','failed') NOT NULL DEFAULT 'sent',
  detail TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ae_user (user_id),
  CONSTRAINT fk_ae_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Editable site content (home/features/pricing/about/contact copy)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_content (
  content_key VARCHAR(64) PRIMARY KEY,
  content_value LONGTEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Settings (payment keys, site flags) — values are never sent to the client
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(64) PRIMARY KEY,
  setting_value TEXT NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
  ('payment_key_id', 'rzp_test_REPLACE_ME'),
  ('payment_key_secret', ''),
  ('payment_mode', 'live'),
  ('currency', 'INR');
