CREATE TABLE `inversePatterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalTradeId` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`originalDirection` enum('LONG','SHORT') NOT NULL,
	`invertedDirection` enum('LONG','SHORT') NOT NULL,
	`conditions` text NOT NULL,
	`confidenceBoost` int NOT NULL DEFAULT 2,
	`timesTriggered` int NOT NULL DEFAULT 0,
	`successRate` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inversePatterns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`direction` enum('LONG','SHORT') NOT NULL,
	`entryPrice` varchar(20) NOT NULL,
	`exitPrice` varchar(20),
	`stopLoss` varchar(20) NOT NULL,
	`takeProfit` varchar(20) NOT NULL,
	`leverage` int NOT NULL,
	`positionSize` varchar(20) NOT NULL,
	`result` enum('win','loss','breakeven','open') NOT NULL DEFAULT 'open',
	`profitLoss` varchar(20),
	`riskLevel` enum('very_high','high','medium','low') NOT NULL,
	`entryConditions` text,
	`aiConfidence` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	CONSTRAINT `trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentLevel` enum('beginner','intermediate','advanced','expert') NOT NULL DEFAULT 'beginner',
	`totalTrades` int NOT NULL DEFAULT 0,
	`winningTrades` int NOT NULL DEFAULT 0,
	`losingTrades` int NOT NULL DEFAULT 0,
	`averageRR` varchar(10) NOT NULL DEFAULT '0',
	`maxDrawdown` varchar(10) NOT NULL DEFAULT '0',
	`quizScore` int NOT NULL DEFAULT 0,
	`quizAttempts` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProgress_id` PRIMARY KEY(`id`),
	CONSTRAINT `userProgress_userId_unique` UNIQUE(`userId`)
);
