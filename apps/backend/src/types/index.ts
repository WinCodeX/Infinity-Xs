import { Request } from "express";
import { Document } from "mongoose";

export enum UserRole {
    CUSTOMER = 'customer',
    ADMIN = 'admin',
    STAFF = 'staff',            
}

export interface IUser extends Document {
    _id: string;
    email: string;
    password?: string;
    name: string;
    role: UserRole;
    googleId?: string;
    avatar?: string;
    phone?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;        
    };
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;

    comparePassword(candidatePassword: string): Promise<boolean>;
    generateAuthToken(): string;
}

export enum ProductCategory {
    CLADS = 'clads',
    SERVICES = 'services',
    ACCESSORIES = 'accessories',
}

export enum ServiceType {
    WEBSITE_DESIGN = 'website_design',
    WEBSITE_CREATION = 'website_creation',
    MPESA_INTEGRATION = 'mpesa_integration',
    MOBILE_APP_DEVELOPMENT = 'mobile_app_development',
    CUSTOM_SOFTWARE = 'custom_software',
}

export interface IProduct extends Document {
    _id: string;
    name: string;
    description: string;
    category: ProductCategory;
    serviceType?: ServiceType;
    price: number;
    stock?: number;
    images: string[];
    sizes?: string[];
    colors?: string[];
    isActive: boolean;
    featured: boolean;
    metadata?: {
        material?: string;
        duration?: string;
        [key: string]: any;
    };
    createdBy: IUser['_id'];
    createdAt: Date;
    updatedAt: Date;
}

export interface ICartItem {
    product: IProduct['_id'];
    quantity: number;
    size?: string;
    color?: string;
    price: number;
 }

export interface ICart extends Document {
    _id: string;
    user: IUser['_id'];
    items: ICartItem[];
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
}

export enum PaymentMethod {
    MPESA = 'mpesa',
    CREDIT_CARD = 'credit_card',
    PAYPAL = 'paypal',
    CASH = 'cash',
}

export interface IOrder extends Document {
    _id: string;
    orderNumber: string;
    user: IUser['_id'];
    items: ICartItem[];
    totalAmount: number;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: 'pending' | 'completed' | 'failed';
    transactionId?: string;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;        
    };
    notes?: string;
    trackingNumber?: string;
    createdAt: Date;
    updatedAt: Date;
    deliveredAt?: Date;
}

export interface IServiceShowcase extends Document {
    _id: string;
    title: string;
    description: string;
    serviceType: ServiceType;
    images: string[];
    clientName?: string;
    projectUrl?: string;
    technologiesUsed?: string[];
    duration?: string;
    featured: boolean;
    createdAt: Date;
}

export interface IMpesaCallback {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResultCode: number;
    ResultDesc: string;
    CallbackMetadata?: {
        Item: Array<{
            Name: string;
            Value: string | number;
        }>;
    };
}

export interface AuthRequest extends Request {
    user?: IUser;
    file?: Express.Multer.File;
    files?: Express.Multer.File[];
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: any;
    pagination?: {
        page: number;
        limit: number;
        totalPages: number;
        total: number;
    };
}

export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
}
export interface QueryParams {
    page?: number;
    limit?: number;
    sort?: string;
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
}