import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
} from 'react-native-purchases';
import { useAuth } from '@/providers/AuthProvider';

const REVENUECAT_API_KEY_IOS = 'test_yKAYIXPROrdGKwhhWRNEZKCmFyS';
// Add Android key here when needed:
// const REVENUECAT_API_KEY_ANDROID = '';

const ENTITLEMENT_ID = 'Stock Up Dinners Pro';

interface RevenueCatContextType {
  customerInfo: CustomerInfo | null;
  isProMember: boolean;
  isLoading: boolean;
  currentOffering: PurchasesOffering | null;
  restorePurchases: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextType>({
  customerInfo: null,
  isProMember: false,
  isLoading: true,
  currentOffering: null,
  restorePurchases: async () => {},
});

export function useRevenueCat() {
  return useContext(RevenueCatContext);
}

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize RevenueCat SDK
  useEffect(() => {
    async function init() {
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      const apiKey =
        Platform.OS === 'ios'
          ? REVENUECAT_API_KEY_IOS
          : REVENUECAT_API_KEY_IOS; // Replace with Android key when available

      Purchases.configure({ apiKey });
    }

    init();
  }, []);

  // Link RevenueCat user to Supabase user on auth
  useEffect(() => {
    async function linkUser() {
      if (isAuthenticated && user) {
        try {
          const { customerInfo } = await Purchases.logIn(user.id);
          setCustomerInfo(customerInfo);
        } catch (error) {
          console.error('RevenueCat logIn error:', error);
        }
      }
      setIsLoading(false);
    }

    linkUser();
  }, [isAuthenticated, user]);

  // Fetch offerings
  useEffect(() => {
    async function fetchOfferings() {
      try {
        const offerings = await Purchases.getOfferings();
        setCurrentOffering(offerings.current);
      } catch (error) {
        console.error('RevenueCat offerings error:', error);
      }
    }

    if (isAuthenticated) {
      fetchOfferings();
    }
  }, [isAuthenticated]);

  // Listen for customer info changes (purchases, renewals, cancellations)
  useEffect(() => {
    const listener = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  const isProMember =
    customerInfo?.entitlements.active[ENTITLEMENT_ID]?.isActive === true;

  const restorePurchases = async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
    } catch (error) {
      console.error('Restore purchases error:', error);
      throw error;
    }
  };

  return (
    <RevenueCatContext.Provider
      value={{
        customerInfo,
        isProMember,
        isLoading,
        currentOffering,
        restorePurchases,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
}
