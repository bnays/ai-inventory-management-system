import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { ChartPieSlice } from '@phosphor-icons/react/dist/ssr/ChartPieSlice';
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree';
import { AddressBook } from '@phosphor-icons/react/dist/ssr/AddressBook';
import { Package } from '@phosphor-icons/react/dist/ssr/Package';
import { Lightbulb } from '@phosphor-icons/react/dist/ssr/Lightbulb';
import { BookOpen } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { SquaresFour } from '@phosphor-icons/react/dist/ssr/SquaresFour';
import { Truck } from '@phosphor-icons/react/dist/ssr/Truck';
import { ShoppingCart } from '@phosphor-icons/react/dist/ssr/ShoppingCart';
import { Receipt } from '@phosphor-icons/react/dist/ssr/Receipt';
import { TrendUp } from '@phosphor-icons/react/dist/ssr/TrendUp';
import { Gear } from '@phosphor-icons/react/dist/ssr/Gear';
import { UserCircle } from '@phosphor-icons/react/dist/ssr/UserCircle';
import { WarningOctagon } from '@phosphor-icons/react/dist/ssr/WarningOctagon';

export const navIcons = {
  'chart-pie-slice': ChartPieSlice,
  'users-three': UsersThree,
  'address-book': AddressBook,
  'package': Package,
  'lightbulb': Lightbulb,
  'book-open': BookOpen,
  'squares-four': SquaresFour,
  'truck': Truck,
  'shopping-cart': ShoppingCart,
  'receipt': Receipt,
  'trend-up': TrendUp,
  'gear': Gear,
  'user-circle': UserCircle,
  'warning-octagon': WarningOctagon,
} as Record<string, Icon>;