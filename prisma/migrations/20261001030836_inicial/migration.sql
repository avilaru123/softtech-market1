-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'cliente') NOT NULL DEFAULT 'cliente',
    `preferredAssistiveTech` VARCHAR(120) NULL,
    `highContrastDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `label` VARCHAR(80) NOT NULL,
    `street` VARCHAR(255) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `region` VARCHAR(100) NOT NULL,
    `postalCode` VARCHAR(20) NOT NULL,
    `country` VARCHAR(80) NOT NULL DEFAULT 'Colombia',
    `phone` VARCHAR(30) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `addresses_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(100) NOT NULL,
    `name` VARCHAR(180) NOT NULL,
    `category` VARCHAR(60) NOT NULL,
    `categoryLabel` VARCHAR(100) NOT NULL,
    `shortCategory` VARCHAR(40) NOT NULL,
    `icon` VARCHAR(80) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `priceType` VARCHAR(100) NOT NULL,
    `image` TEXT NOT NULL,
    `imageAlt` TEXT NOT NULL,
    `badge` VARCHAR(100) NOT NULL,
    `subBadge` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `inStock` BOOLEAN NOT NULL DEFAULT true,
    `stockCount` INTEGER NOT NULL DEFAULT 0,
    `isDownload` BOOLEAN NOT NULL DEFAULT false,
    `wcagLevel` VARCHAR(40) NOT NULL,
    `inputMethod` VARCHAR(40) NOT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `contrastRatio` VARCHAR(30) NULL,
    `warrantyInfo` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `products_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_specs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` VARCHAR(100) NOT NULL,
    `label` VARCHAR(120) NOT NULL,
    `value` TEXT NOT NULL,

    UNIQUE INDEX `product_specs_productId_label_key`(`productId`, `label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(30) NOT NULL,
    `orderNumber` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NULL,
    `customerName` VARCHAR(120) NOT NULL,
    `customerEmail` VARCHAR(254) NOT NULL,
    `totalAmount` DECIMAL(12, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'COP',
    `status` ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    `paymentStatus` ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    `paymentMethod` VARCHAR(80) NULL,
    `paymentReference` VARCHAR(180) NULL,
    `shippingAddress` TEXT NULL,
    `shippingPhone` VARCHAR(30) NULL,
    `deliveryNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_orderNumber_key`(`orderNumber`),
    INDEX `orders_customerEmail_idx`(`customerEmail`),
    INDEX `orders_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` VARCHAR(30) NOT NULL,
    `orderId` VARCHAR(30) NOT NULL,
    `productId` VARCHAR(100) NULL,
    `productName` VARCHAR(180) NOT NULL,
    `unitPrice` DECIMAL(12, 2) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `lineTotal` DECIMAL(12, 2) NOT NULL,

    INDEX `order_items_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_specs` ADD CONSTRAINT `product_specs_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
