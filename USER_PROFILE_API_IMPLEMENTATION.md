# User Profile API Implementation Guide

## Database Structure Summary

### Tables:
1. **customers** - For ALL customers (guest + registered)
2. **user_profiles** - For registered users only (extends auth.users)
3. **admin_users** - For admin panel access
4. **auth.users** - Supabase managed authentication

## Frontend API Implementation

### 1. User Profile Service (`/src/lib/services/userProfileService.ts`)

```typescript
import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  size_profile: SizeProfile;
  style_preferences: StylePreferences;
  saved_addresses: SavedAddress[];
  saved_payment_methods: PaymentMethod[];
  wishlist_items: string[];
  notification_preferences: NotificationPreferences;
  onboarding_completed: boolean;
}

export interface SizeProfile {
  chest?: number;
  waist?: number;
  inseam?: number;
  neck?: number;
  sleeve?: number;
  shoulder_width?: number;
  jacket_length?: number;
  shoe_size: {
    us?: number;
    uk?: number;
    eu?: number;
    width: 'narrow' | 'medium' | 'wide';
  };
  preferred_fit: {
    jackets: 'slim' | 'regular' | 'athletic' | 'loose';
    pants: 'slim' | 'regular' | 'athletic' | 'loose';
    shirts: 'slim' | 'regular' | 'athletic' | 'loose';
  };
  body_type?: 'athletic' | 'regular' | 'full' | 'tall' | 'short';
  measured_by: 'self' | 'tailor' | 'kct_store';
  confidence_level: number;
}

export interface StylePreferences {
  preferred_colors: string[];
  accent_colors: string[];
  avoid_colors: string[];
  preferred_styles: string[];
  occasions: string[];
  brands: string[];
  avoid_materials: string[];
  budget_ranges: {
    suits: { min: number; max: number };
    shirts: { min: number; max: number };
    accessories: { min: number; max: number };
  };
}

class UserProfileService {
  private supabase = createClient();

  // Get current user's profile
  async getProfile(userId?: string): Promise<UserProfile | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    const id = userId || user?.id;
    
    if (!id) return null;

    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  }

  // Update profile
  async updateProfile(updates: Partial<UserProfile>): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return false;

    const { error } = await this.supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id);

    return !error;
  }

  // Update size profile
  async updateSizeProfile(sizeProfile: Partial<SizeProfile>): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return false;

    const { error } = await this.supabase
      .from('user_profiles')
      .update({ size_profile: sizeProfile })
      .eq('id', user.id);

    return !error;
  }

  // Update style preferences
  async updateStylePreferences(preferences: Partial<StylePreferences>): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return false;

    const { error } = await this.supabase
      .from('user_profiles')
      .update({ style_preferences: preferences })
      .eq('id', user.id);

    return !error;
  }

  // Wishlist operations
  async addToWishlist(productId: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return false;

    const { error } = await this.supabase
      .rpc('add_to_wishlist', {
        user_id: user.id,
        product_id: productId
      });

    return !error;
  }

  async removeFromWishlist(productId: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return false;

    const { error } = await this.supabase
      .rpc('remove_from_wishlist', {
        user_id: user.id,
        product_id: productId
      });

    return !error;
  }

  // Address management
  async addAddress(address: SavedAddress): Promise<boolean> {
    const profile = await this.getProfile();
    if (!profile) return false;

    const addresses = [...profile.saved_addresses, address];
    return this.updateProfile({ saved_addresses: addresses });
  }

  async updateAddress(addressId: string, updates: Partial<SavedAddress>): Promise<boolean> {
    const profile = await this.getProfile();
    if (!profile) return false;

    const addresses = profile.saved_addresses.map(addr =>
      addr.id === addressId ? { ...addr, ...updates } : addr
    );
    
    return this.updateProfile({ saved_addresses: addresses });
  }

  async deleteAddress(addressId: string): Promise<boolean> {
    const profile = await this.getProfile();
    if (!profile) return false;

    const addresses = profile.saved_addresses.filter(addr => addr.id !== addressId);
    return this.updateProfile({ saved_addresses: addresses });
  }
}

export const userProfileService = new UserProfileService();
```

### 2. API Routes Structure

```typescript
// /src/app/api/user-profiles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const updates = await request.json();

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### 3. React Hook for Profile Management

```typescript
// /src/hooks/useUserProfile.ts
import { useState, useEffect } from 'react';
import { userProfileService, UserProfile } from '@/lib/services/userProfileService';
import { useAuth } from '@/hooks/useAuth';

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userProfileService.getProfile();
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const success = await userProfileService.updateProfile(updates);
      if (success) {
        await loadProfile();
        return true;
      }
      return false;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const updateSizeProfile = async (sizeProfile: Partial<SizeProfile>) => {
    return updateProfile({ size_profile: { ...profile?.size_profile, ...sizeProfile } });
  };

  const updateStylePreferences = async (preferences: Partial<StylePreferences>) => {
    return updateProfile({ style_preferences: { ...profile?.style_preferences, ...preferences } });
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateSizeProfile,
    updateStylePreferences,
    refresh: loadProfile
  };
}
```

### 4. Profile Components Implementation

```typescript
// /src/components/profile/SizeProfileSection.tsx
import { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';

export function SizeProfileSection() {
  const { profile, updateSizeProfile } = useUserProfile();
  const [measurements, setMeasurements] = useState(profile?.size_profile || {});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateSizeProfile(measurements);
    setSaving(false);
    
    if (success) {
      // Show success toast
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Size Profile</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Chest</label>
          <input
            type="number"
            value={measurements.chest || ''}
            onChange={(e) => setMeasurements({...measurements, chest: Number(e.target.value)})}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="42"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Waist</label>
          <input
            type="number"
            value={measurements.waist || ''}
            onChange={(e) => setMeasurements({...measurements, waist: Number(e.target.value)})}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="34"
          />
        </div>
        
        {/* Add more measurement fields */}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Measurements'}
        </button>
      </div>
    </div>
  );
}
```

## Backend Synchronization Points

### 1. Customer vs User Profile
- **Customer record**: Created for ALL purchases (guest or registered)
- **User profile**: Only for registered users with auth account
- Link via email address when guest converts to registered user

### 2. Data Sync Strategy
```typescript
// When guest user registers
async function linkGuestToUser(guestEmail: string, userId: string) {
  // Update customer record with user_id
  await supabase
    .from('customers')
    .update({ user_id: userId })
    .eq('email', guestEmail);
    
  // Merge order history
  await supabase
    .from('orders')
    .update({ user_id: userId })
    .eq('customer_email', guestEmail);
}
```

### 3. Admin Panel Integration
```typescript
// Admin can view/edit user profiles
interface AdminUserProfileView {
  getUserProfile(userId: string): Promise<UserProfile>;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean>;
  getUserOrders(userId: string): Promise<Order[]>;
  getUserMetrics(userId: string): Promise<CustomerMetrics>;
}
```

## Testing Checklist

- [ ] User can create profile on registration
- [ ] Profile auto-populates from auth data
- [ ] Size measurements save correctly
- [ ] Style preferences update properly
- [ ] Wishlist add/remove functions work
- [ ] Address management (CRUD) works
- [ ] Notification preferences persist
- [ ] Guest to registered user conversion
- [ ] Profile data syncs with backend
- [ ] Admin can view/edit profiles

## Security Considerations

1. **RLS Policies**: Users can only access their own profile
2. **Data Validation**: Validate all inputs before saving
3. **PII Protection**: Never expose sensitive data in logs
4. **Token Security**: Payment methods stored as tokens only
5. **Avatar Uploads**: Validate file types and sizes

## Performance Optimizations

1. **Lazy Loading**: Load profile sections on demand
2. **Caching**: Cache profile data with React Query
3. **Debouncing**: Debounce auto-save operations
4. **Batch Updates**: Group multiple field updates
5. **Optimistic Updates**: Update UI before server confirmation