-- Create enum types
CREATE TYPE public.rider_status AS ENUM ('potential', 'financed', 'completed', 'defaulted', 'repossessed');
CREATE TYPE public.user_role AS ENUM ('admin', 'accountant', 'rider_clerk');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'overdue');
CREATE TYPE public.transaction_type AS ENUM ('daily_remittance', 'expense', 'transfer', 'repossession');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'rider_clerk',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create potential riders table
CREATE TABLE public.potential_riders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  id_number TEXT NOT NULL UNIQUE,
  age INTEGER NOT NULL,
  postal_address TEXT NOT NULL,
  primary_phone TEXT NOT NULL,
  secondary_phone TEXT,
  tertiary_phone TEXT,
  introducer_name TEXT,
  introducer_id TEXT,
  introducer_phone TEXT,
  introducer_previous_bike TEXT,
  introducer_residential_area TEXT,
  preferred_bike_make TEXT,
  probable_financing_date DATE,
  status rider_status NOT NULL DEFAULT 'potential',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bikes table
CREATE TABLE public.bikes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  make TEXT NOT NULL,
  chassis_no TEXT NOT NULL UNIQUE,
  engine_no TEXT NOT NULL UNIQUE,
  registration_no TEXT UNIQUE,
  colour TEXT NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  purchase_date DATE NOT NULL,
  current_rider_id UUID,
  status TEXT NOT NULL DEFAULT 'available', -- available, assigned, repossessed, sold
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financed riders table
CREATE TABLE public.financed_riders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  potential_rider_id UUID REFERENCES public.potential_riders(id),
  full_name TEXT NOT NULL,
  id_number TEXT NOT NULL UNIQUE,
  age INTEGER NOT NULL,
  postal_address TEXT NOT NULL,
  primary_phone TEXT NOT NULL,
  secondary_phone TEXT,
  tertiary_phone TEXT,
  residential_area TEXT NOT NULL,
  operation_slot TEXT NOT NULL, -- Shimo
  referee_name TEXT,
  referee_id TEXT,
  referee_phone TEXT,
  next_of_kin_name TEXT NOT NULL,
  next_of_kin_id TEXT NOT NULL,
  next_of_kin_phone TEXT NOT NULL,
  next_of_kin_relationship TEXT NOT NULL,
  bike_id UUID REFERENCES public.bikes(id),
  start_date DATE NOT NULL,
  daily_remittance DECIMAL(8,2) NOT NULL,
  operation_slot_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_investment DECIMAL(10,2) NOT NULL,
  expected_operation_days INTEGER NOT NULL,
  status rider_status NOT NULL DEFAULT 'financed',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id UUID REFERENCES public.financed_riders(id) NOT NULL,
  amount DECIMAL(8,2) NOT NULL,
  payment_date DATE NOT NULL,
  transaction_reference TEXT,
  payment_method TEXT NOT NULL DEFAULT 'mpesa',
  status payment_status NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business expenses table
CREATE TABLE public.business_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  category TEXT NOT NULL,
  reference_no TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create journal entries table for cash transfers
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type transaction_type NOT NULL,
  reference_no TEXT,
  from_account TEXT,
  to_account TEXT,
  transaction_date DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SMS notifications log
CREATE TABLE public.sms_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL, -- registration, payment_confirmation, overdue, repossession_warning, etc.
  rider_id UUID,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.potential_riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financed_riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for potential riders
CREATE POLICY "Authenticated users can view potential riders" ON public.potential_riders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create potential riders" ON public.potential_riders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update potential riders" ON public.potential_riders FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for bikes
CREATE POLICY "Authenticated users can view bikes" ON public.bikes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage bikes" ON public.bikes FOR ALL TO authenticated USING (true);

-- Create RLS policies for financed riders
CREATE POLICY "Authenticated users can view financed riders" ON public.financed_riders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create financed riders" ON public.financed_riders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update financed riders" ON public.financed_riders FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for payments
CREATE POLICY "Authenticated users can view payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update payments" ON public.payments FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for business expenses
CREATE POLICY "Authenticated users can view business expenses" ON public.business_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and accountants can manage expenses" ON public.business_expenses FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
);

-- Create RLS policies for journal entries
CREATE POLICY "Authenticated users can view journal entries" ON public.journal_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and accountants can manage journal entries" ON public.journal_entries FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
);

-- Create RLS policies for SMS notifications
CREATE POLICY "Authenticated users can view SMS notifications" ON public.sms_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create SMS notifications" ON public.sms_notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_potential_riders_updated_at BEFORE UPDATE ON public.potential_riders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_bikes_updated_at BEFORE UPDATE ON public.bikes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_financed_riders_updated_at BEFORE UPDATE ON public.financed_riders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_business_expenses_updated_at BEFORE UPDATE ON public.business_expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Add foreign key constraint to link bikes to current rider
ALTER TABLE public.bikes ADD CONSTRAINT fk_bikes_current_rider FOREIGN KEY (current_rider_id) REFERENCES public.financed_riders(id);

-- Add indexes for better performance
CREATE INDEX idx_potential_riders_id_number ON public.potential_riders(id_number);
CREATE INDEX idx_potential_riders_status ON public.potential_riders(status);
CREATE INDEX idx_financed_riders_id_number ON public.financed_riders(id_number);
CREATE INDEX idx_financed_riders_status ON public.financed_riders(status);
CREATE INDEX idx_financed_riders_bike_id ON public.financed_riders(bike_id);
CREATE INDEX idx_payments_rider_id ON public.payments(rider_id);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_bikes_chassis_no ON public.bikes(chassis_no);
CREATE INDEX idx_bikes_engine_no ON public.bikes(engine_no);
CREATE INDEX idx_bikes_current_rider_id ON public.bikes(current_rider_id);
CREATE INDEX idx_sms_notifications_recipient_phone ON public.sms_notifications(recipient_phone);
CREATE INDEX idx_sms_notifications_status ON public.sms_notifications(status);