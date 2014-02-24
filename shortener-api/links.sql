DROP TABLE IF EXISTS `shortlinks`;
CREATE TABLE `shortlinks` (
	`shortlink_id` varchar(64) binary NOT NULL,
	`url` text NOT NULL,
	`creation_date_time` datetime NOT NULL,
	`creation_user_id` varchar(64) binary NOT NULL,
	PRIMARY KEY (`shortlink_id`));

DROP TABLE IF EXISTS `shortlink_hits`;
CREATE TABLE `shortlink_hits` (
	`shortlink_id` varchar(64) binary NOT NULL,
	`access_time` datetime NOT NULL,
	`client_ip_address` varchar(64) NOT NULL,
	`referer` varchar(64) NOT NULL,
	PRIMARY KEY (`access_time`, `shortlink_id`));