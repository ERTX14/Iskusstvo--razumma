CREATE DATABASE IF NOT EXISTS iskusstvo_razuma
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE iskusstvo_razuma;

CREATE TABLE IF NOT EXISTS applications (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    parent_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    child_name VARCHAR(150) NOT NULL,
    child_birth_date DATE NOT NULL,
    course_key VARCHAR(50) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    additional_info TEXT NULL,
    personal_data_consent TINYINT(1) NOT NULL DEFAULT 0,
    telegram_sent TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_created_at (created_at),
    INDEX idx_course_key (course_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
