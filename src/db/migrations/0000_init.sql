CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text DEFAULT 'company' NOT NULL,
	`name` text NOT NULL,
	`contact_name` text,
	`email` text,
	`cc_emails` text,
	`phone` text,
	`address` text,
	`postal_code` text,
	`city` text,
	`country` text DEFAULT 'France' NOT NULL,
	`siren` text,
	`vat_number` text,
	`payment_terms_days` integer,
	`notes` text,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_clients_email` ON `clients` (`email`);--> statement-breakpoint
CREATE TABLE `cv_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`note` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `document_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`document_id` text NOT NULL,
	`kind` text NOT NULL,
	`detail` text,
	`at` integer NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_document_events_document` ON `document_events` (`document_id`,`at`);--> statement-breakpoint
CREATE TABLE `document_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`position` integer NOT NULL,
	`title` text NOT NULL,
	`details` text,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit` text,
	`unit_price_cents` integer NOT NULL,
	`total_cents` integer NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_document_lines_document` ON `document_lines` (`document_id`,`position`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`number` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`client_id` text NOT NULL,
	`source_id` text,
	`subject` text,
	`issue_date` text,
	`due_date` text,
	`vat_rate` real,
	`total_ht_cents` integer DEFAULT 0 NOT NULL,
	`vat_cents` integer DEFAULT 0 NOT NULL,
	`total_ttc_cents` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`terms` text,
	`client_snapshot` text,
	`issuer_snapshot` text,
	`pdf_key` text,
	`sent_at` integer,
	`accepted_at` integer,
	`refused_at` integer,
	`paid_at` integer,
	`payment_method` text,
	`last_reminder_at` integer,
	`reminder_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_number_unique` ON `documents` (`number`);--> statement-breakpoint
CREATE INDEX `idx_documents_type_status` ON `documents` (`type`,`status`);--> statement-breakpoint
CREATE INDEX `idx_documents_client` ON `documents` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_documents_source` ON `documents` (`source_id`);--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ip` text NOT NULL,
	`ok` integer NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_login_attempts_ip_at` ON `login_attempts` (`ip`,`at`);--> statement-breakpoint
CREATE INDEX `idx_login_attempts_at` ON `login_attempts` (`at`);--> statement-breakpoint
CREATE TABLE `mails` (
	`id` text PRIMARY KEY NOT NULL,
	`direction` text NOT NULL,
	`mailbox` text,
	`uid_validity` integer,
	`uid` integer,
	`message_id` text,
	`in_reply_to` text,
	`references` text,
	`from_address` text,
	`from_name` text,
	`to_addresses` text DEFAULT '[]' NOT NULL,
	`cc_addresses` text DEFAULT '[]' NOT NULL,
	`subject` text,
	`snippet` text,
	`text_body` text,
	`has_html` integer DEFAULT false NOT NULL,
	`attachments` text DEFAULT '[]' NOT NULL,
	`raw_key` text,
	`size` integer DEFAULT 0 NOT NULL,
	`partial` integer DEFAULT false NOT NULL,
	`date` integer NOT NULL,
	`seen` integer DEFAULT false NOT NULL,
	`client_id` text,
	`document_id` text,
	`status` text NOT NULL,
	`error` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_mails_imap` ON `mails` (`mailbox`,`uid_validity`,`uid`);--> statement-breakpoint
CREATE INDEX `idx_mails_direction_date` ON `mails` (`direction`,`date`);--> statement-breakpoint
CREATE INDEX `idx_mails_client` ON `mails` (`client_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_mails_document` ON `mails` (`document_id`);--> statement-breakpoint
CREATE INDEX `idx_mails_message_id` ON `mails` (`message_id`);--> statement-breakpoint
CREATE TABLE `sequences` (
	`key` text PRIMARY KEY NOT NULL,
	`value` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
