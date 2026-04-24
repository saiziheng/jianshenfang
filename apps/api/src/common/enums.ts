export enum AppRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  FRONT_DESK = 'FRONT_DESK',
  TRAINER = 'TRAINER'
}

export enum AppMemberStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  EXPIRED = 'EXPIRED',
  BLACKLISTED = 'BLACKLISTED'
}

export enum AppPackageType {
  TIME_CARD = 'TIME_CARD',
  VISIT_CARD = 'VISIT_CARD',
  PT_CARD = 'PT_CARD'
}

export enum AppCardStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  FROZEN = 'FROZEN',
  TRANSFERRED = 'TRANSFERRED'
}

export enum AppAppointmentStatus {
  BOOKED = 'BOOKED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  ABSENT = 'ABSENT'
}

export enum AppAccessDirection {
  IN = 'IN',
  OUT = 'OUT'
}

export enum AppAccessResult {
  ALLOWED = 'ALLOWED',
  DENIED = 'DENIED',
  ERROR = 'ERROR',
  MANUAL = 'MANUAL'
}

export enum AppPaymentMethod {
  CASH = 'CASH',
  WECHAT = 'WECHAT',
  ALIPAY = 'ALIPAY',
  BANK_CARD = 'BANK_CARD',
  OTHER = 'OTHER'
}

export const BUSINESS_CONSTANTS = {
  APPOINTMENT_MINUTES_STEP: 15,
  APPOINTMENT_CANCEL_RETURN_HOURS: 2,
  DEFAULT_CARD_WARNING_DAYS: 7,
  DEFAULT_CARD_WARNING_VISITS: 3
} as const;
