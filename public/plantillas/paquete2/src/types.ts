/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RSVP {
  id: string;
  name: string;
  email: string;
  attending: boolean;
  guestsCount: number;
  dietaryNotes?: string;
  timestamp: string;
  message?: string;
}

export interface GiftRegistryOption {
  id: string;
  name: string;
  icon: string;
  details: string;
  link?: string;
  clabe?: string;
  bank?: string;
  beneficiary?: string;
}

export interface TimelineEvent {
  time: string;
  title: string;
  description: string;
  icon: string;
}
