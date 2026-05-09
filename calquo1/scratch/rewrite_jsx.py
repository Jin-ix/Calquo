import sys

def rewrite_jsx(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the start of the return statement
    return_index = content.find('  return (')
    if return_index == -1:
        print("Could not find return statement")
        return

    # Keep everything before the return statement
    pre_jsx = content[:return_index]

    new_jsx = """  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans">
      
      {/* LEFT PANEL - FIXED & COVERING */}
      <div className="w-full lg:w-5/12 relative lg:fixed lg:inset-y-0 lg:left-0 h-64 lg:h-screen z-10 overflow-hidden shadow-2xl">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transform scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1627052045858-8f43726852d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHBhc3RlbCUyMHBlYWNoJTIwZmFicmljJTIwdGV4dGlsZSUyMGZhc2hpb24lMjBtaW5pbWFsaXN0fGVufDF8fHx8MTc2NTI2MDQxNXww&ixlib=rb-4.1.0&q=80&w=1080')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent lg:bg-gradient-to-br lg:from-slate-900/90 lg:via-slate-900/40 lg:to-transparent" />
        
        <div className="absolute top-6 left-6 z-20">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBackToLogin}
            className="text-white hover:bg-white/20 hover:text-white backdrop-blur-md border border-white/10 rounded-full px-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 p-8 lg:p-16 text-white z-10 w-full">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-6 border border-white/20 shadow-xl">
             <Shield className="h-8 w-8 text-orange-300" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight leading-tight">
            Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-rose-300">CALIQUO</span> Network
          </h1>
          <p className="text-lg lg:text-xl text-slate-200 font-light max-w-md">
            Create your premium business account today and connect with India's top manufacturers, traders, and retailers.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - SCROLLING FORM */}
      <div className="w-full lg:w-7/12 lg:ml-auto min-h-screen bg-slate-50/50 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto p-6 lg:p-12 relative z-10 pt-10 lg:pt-20 pb-24">
          
          {step === 'form' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              {/* Modern Progress Header */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-white flex items-center justify-center font-bold shadow-lg shadow-orange-500/30">1</div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Business Registration</h2>
                </div>
                <p className="text-slate-500 ml-11 text-lg">Provide your details to verify your business identity.</p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-8">
                {errors.general && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3 shadow-sm animate-in shake duration-300">
                    <Shield className="h-5 w-5 shrink-0 mt-0.5" />
                    <p>{errors.general}</p>
                  </div>
                )}

                {/* CARD 1: Business Details */}
                <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                  <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-50">
                    <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Company Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 relative group">
                      <Label htmlFor="company" className="text-sm font-semibold text-slate-700">Company Name *</Label>
                      <Input
                        id="company"
                        value={formData.company_name}
                        onChange={(e) => handleChange('company_name', e.target.value)}
                        placeholder="Enter registered company name"
                        className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-orange-500/20 rounded-xl transition-all shadow-sm"
                      />
                      {errors.company_name && <p className="text-sm text-red-500 mt-1">{errors.company_name}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-semibold text-slate-700">Business Role *</Label>
                      <Select value={formData.business_role} onValueChange={(value) => handleChange('business_role', value)}>
                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-orange-500/20 rounded-xl transition-all shadow-sm">
                          <SelectValue placeholder="Select primary role" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                          {Object.entries(roleIcons).map(([key, Icon]) => (
                            <SelectItem key={key} value={key} className="cursor-pointer">
                              <div className="flex items-center gap-3 py-1">
                                <div className="p-1.5 bg-slate-100 rounded-md"><Icon className="h-4 w-4 text-slate-700" /></div>
                                <span className="capitalize font-medium text-slate-700">{key.replace('-', ' ')}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.business_role && <p className="text-sm text-red-500 mt-1">{errors.business_role}</p>}
                    </div>
                  </div>

                  {formData.business_role === 'financial' && (
                    <div className="mt-6 flex items-start space-x-3 p-5 bg-orange-50/50 rounded-xl border border-orange-100 transition-all">
                      <Checkbox 
                        id="isAlsoTrader" 
                        checked={formData.isAlsoTrader}
                        onCheckedChange={(checked) => handleChange('isAlsoTrader', checked === true)}
                        className="mt-1 border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white"
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="isAlsoTrader" className="text-sm font-bold cursor-pointer text-slate-900">
                          Also operating as a Trader?
                        </Label>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          Check this if you also trade goods in addition to providing financial services.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 space-y-2">
                    <Label htmlFor="gstNumber" className="text-sm font-semibold text-slate-700 flex justify-between">
                      <span>GST Number *</span>
                      {gstVerified && <span className="text-green-600 text-xs flex items-center"><CheckCircle2 className="h-3 w-3 mr-1"/> Verified</span>}
                    </Label>
                    <div className="flex gap-3 relative">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FileText className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                          id="gstNumber"
                          value={formData.gst_number}
                          onChange={(e) => handleChange('gst_number', e.target.value.toUpperCase())}
                          placeholder="27AAECA1234E1ZM"
                          className={`h-12 pl-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-orange-500/20 rounded-xl transition-all shadow-sm font-mono uppercase tracking-wider ${gstVerified ? 'border-green-300 bg-green-50/30' : ''}`}
                          disabled={gstVerified}
                          maxLength={15}
                        />
                      </div>
                      {!gstVerified && (
                        <Button
                          type="button"
                          onClick={handleVerifyGst}
                          disabled={verifyingGst || !formData.gst_number}
                          className="h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all font-semibold"
                        >
                          {verifyingGst ? 'Verifying...' : 'Verify GST'}
                        </Button>
                      )}
                    </div>
                    {errors.gst_number && <p className="text-sm text-red-500 mt-1">{errors.gst_number}</p>}
                  </div>
                </div>

                {/* CARD 2: Personal Contact */}
                <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                  <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-50">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Personal Contact</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="owner_name" className="text-sm font-semibold text-slate-700">Owner Name *</Label>
                      <Input
                        id="owner_name"
                        value={formData.owner_name}
                        onChange={(e) => handleChange('owner_name', e.target.value)}
                        placeholder="Enter full name as per records"
                        className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all shadow-sm"
                      />
                      {errors.owner_name && <p className="text-sm text-red-500 mt-1">{errors.owner_name}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Mobile Section */}
                      <div className="space-y-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/30">
                        <Label htmlFor="mobile" className="text-sm font-semibold text-slate-700 flex justify-between">
                          <span>Mobile Number *</span>
                          {mobileVerified && <span className="text-green-600 text-xs flex items-center"><CheckCircle2 className="h-3 w-3 mr-1"/> Verified</span>}
                        </Label>
                        
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-slate-400" />
                          </div>
                          <Input
                            id="mobile"
                            value={formData.mobile}
                            onChange={(e) => handleChange('mobile', e.target.value)}
                            placeholder="9876543210"
                            className={`h-12 pl-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all shadow-sm tracking-wide ${mobileVerified ? 'border-green-300 bg-green-50/30' : ''}`}
                            maxLength={10}
                            disabled={mobileVerified}
                          />
                        </div>
                        
                        {!mobileVerified && !mobileOtpSent && (
                          <Button type="button" variant="outline" onClick={handleSendMobileOtp} disabled={verifyingMobile || !formData.mobile} className="w-full h-11 text-sm font-semibold rounded-xl border-slate-200 hover:bg-slate-50">
                             {verifyingMobile ? 'Sending OTP...' : 'Send OTP via SMS'}
                          </Button>
                        )}

                        {mobileOtpSent && !mobileVerified && (
                          <div className="space-y-3 p-4 bg-white rounded-xl shadow-sm border border-slate-100 animate-in zoom-in-95 duration-200">
                            <div className="flex gap-2">
                              <Input value={mobileOtpCode} onChange={(e) => setMobileOtpCode(e.target.value)} placeholder="6-digit OTP" maxLength={6} className="h-11 bg-slate-50 text-center tracking-widest font-mono font-bold" />
                              <Button type="button" onClick={handleVerifyMobileOtp} disabled={verifyingMobile || mobileOtpCode.length !== 6} className="h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
                                Verify
                              </Button>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-slate-500 px-1">
                               <span>Sent to {formData.mobile}</span>
                               {mobileOtpTimer > 0 ? <span className="text-blue-600">{mobileOtpTimer}s</span> : <button type="button" onClick={handleSendMobileOtp} className="text-blue-600 hover:underline">Resend OTP</button>}
                            </div>
                          </div>
                        )}
                        {errors.mobile && <p className="text-sm text-red-500">{errors.mobile}</p>}
                        {errors.mobileOtp && <p className="text-sm text-red-500">{errors.mobileOtp}</p>}
                      </div>

                      {/* Email Section */}
                      <div className="space-y-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/30">
                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700 flex justify-between">
                          <span>Email Address *</span>
                          {emailVerified && <span className="text-green-600 text-xs flex items-center"><CheckCircle2 className="h-3 w-3 mr-1"/> Verified</span>}
                        </Label>
                        
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-400" />
                          </div>
                          <Input
                            id="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="name@company.com"
                            className={`h-12 pl-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all shadow-sm ${emailVerified ? 'border-green-300 bg-green-50/30' : ''}`}
                            disabled={emailVerified}
                          />
                        </div>

                        {!emailVerified && !emailOtpSent && (
                          <Button type="button" variant="outline" onClick={handleSendEmailOtp} disabled={verifyingEmail || !formData.email} className="w-full h-11 text-sm font-semibold rounded-xl border-slate-200 hover:bg-slate-50">
                             {verifyingEmail ? 'Sending OTP...' : 'Send OTP via Email'}
                          </Button>
                        )}

                        {emailOtpSent && !emailVerified && (
                          <div className="space-y-3 p-4 bg-white rounded-xl shadow-sm border border-slate-100 animate-in zoom-in-95 duration-200">
                            <div className="flex gap-2">
                              <Input value={emailOtpCode} onChange={(e) => setEmailOtpCode(e.target.value)} placeholder="6-digit OTP" maxLength={6} className="h-11 bg-slate-50 text-center tracking-widest font-mono font-bold" />
                              <Button type="button" onClick={handleVerifyEmailOtp} disabled={verifyingEmail || emailOtpCode.length !== 6} className="h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
                                Verify
                              </Button>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-slate-500 px-1">
                               <span>Sent to email</span>
                               {emailOtpTimer > 0 ? <span className="text-blue-600">{emailOtpTimer}s</span> : <button type="button" onClick={handleSendEmailOtp} className="text-blue-600 hover:underline">Resend OTP</button>}
                            </div>
                          </div>
                        )}
                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        {errors.emailOtp && <p className="text-sm text-red-500">{errors.emailOtp}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 3: Business Address */}
                <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                  <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-50">
                    <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-teal-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Business Location</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2 relative">
                      <Label htmlFor="street_address" className="text-sm font-semibold text-slate-700">Street Address *</Label>
                      <Input
                        id="street_address"
                        value={formData.street_address}
                        onChange={(e) => handleChange('street_address', e.target.value)}
                        placeholder="Floor, Building, Street, Area"
                        className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-teal-500/20 rounded-xl transition-all shadow-sm"
                      />
                      {errors.street_address && <p className="text-sm text-red-500 mt-1">{errors.street_address}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-2">
                         <Label htmlFor="city" className="text-sm font-semibold text-slate-700">City *</Label>
                         <Input id="city" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-teal-500/20 rounded-xl transition-all shadow-sm"/>
                        {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
                      </div>
                      <div className="space-y-2">
                         <Label htmlFor="state" className="text-sm font-semibold text-slate-700">State *</Label>
                         <Input id="state" value={formData.state} onChange={(e) => handleChange('state', e.target.value)} className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-teal-500/20 rounded-xl transition-all shadow-sm"/>
                        {errors.state && <p className="text-sm text-red-500 mt-1">{errors.state}</p>}
                      </div>
                      <div className="space-y-2">
                         <Label htmlFor="postal_code" className="text-sm font-semibold text-slate-700">PIN Code *</Label>
                         <Input id="postal_code" value={formData.postal_code} onChange={(e) => handleChange('postal_code', e.target.value)} className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-teal-500/20 rounded-xl transition-all shadow-sm" maxLength={6}/>
                        {errors.postal_code && <p className="text-sm text-red-500 mt-1">{errors.postal_code}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    type="submit"
                    className={`w-full h-14 font-bold text-lg rounded-2xl shadow-xl transition-all ${
                      (isLoading || !allVerificationsComplete) 
                        ? 'bg-slate-200 text-slate-400 shadow-none' 
                        : 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-0.5'
                    }`}
                    disabled={isLoading || !allVerificationsComplete}
                  >
                    {isLoading ? 'Processing...' : 
                      !gstVerified ? 'Please Verify GST Number' :
                      !mobileVerified ? 'Please Verify Mobile Number' :
                      !emailVerified ? 'Please Verify Email Address' :
                      'Complete Registration securely'}
                  </Button>
                  <p className="text-center text-sm font-medium text-slate-500 mt-6">
                    By registering, you agree to CALIQUO's <span className="text-slate-900 underline cursor-pointer hover:text-orange-600 transition-colors">Terms of Service</span> and <span className="text-slate-900 underline cursor-pointer hover:text-orange-600 transition-colors">Privacy Policy</span>.
                  </p>
                </div>
              </form>
            </div>
          )}

          {step === 'preferences' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
              <div className="mb-10 text-center">
                <div className="h-16 w-16 mx-auto bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                   <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Registration Successful!</h2>
                <p className="text-slate-500 text-lg">Let's personalize your B2B discovery feed for better matches.</p>
              </div>

              {/* Preferences Cards ... keeping existing logic but styling similarly */}
              <div className="space-y-6">
                {(formData.business_role === 'retailer' || formData.business_role === 'trader') && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <Label className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4"><Store className="h-4 w-4 text-orange-500"/> Type of Shop</Label>
                        <Input placeholder="e.g. Boutique, Showroom, Wholesale" value={preferences.shopType || ''} onChange={(e) => setPreferences(prev => ({ ...prev, shopType: e.target.value }))} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                      </div>
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <Label className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4"><Search className="h-4 w-4 text-orange-500"/> Preferred Dress Type</Label>
                        <Input placeholder="e.g. Ethnic, Western, Kids" value={preferences.preferredDressType || ''} onChange={(e) => setPreferences(prev => ({ ...prev, preferredDressType: e.target.value }))} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <Label className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4"><User className="h-4 w-4 text-orange-500"/> Preferred Sellers</Label>
                        <Input placeholder="List specific brands or companies" value={preferences.preferredSellers || ''} onChange={(e) => setPreferences(prev => ({ ...prev, preferredSellers: e.target.value }))} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                      </div>
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <Label className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4"><MapPin className="h-4 w-4 text-orange-500"/> Seller Locations</Label>
                        <Input placeholder="e.g. Surat, Mumbai, Delhi" value={preferences.preferredSellerLocation || ''} onChange={(e) => setPreferences(prev => ({ ...prev, preferredSellerLocation: e.target.value }))} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                      </div>
                    </div>
                  </div>
                )}

                {(formData.business_role === 'manufacturer' || formData.business_role === 'retailer' || formData.business_role === 'trader') && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <Label className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4"><Truck className="h-4 w-4 text-blue-500"/> Preferred Travel/Logistics Agent</Label>
                    <Input placeholder="Enter name of your preferred agent" value={preferences.preferredTravelAgent || ''} onChange={(e) => setPreferences(prev => ({ ...prev, preferredTravelAgent: e.target.value }))} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                  </div>
                )}

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <Label className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4"><MapPin className="h-4 w-4 text-teal-500"/> Preferred Supplier Location</Label>
                  <Select value={preferences.preferredLocation} onValueChange={(val) => setPreferences(prev => ({ ...prev, preferredLocation: val }))}>
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Select location preference" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All over India (Best Prices)</SelectItem>
                      <SelectItem value="local_state">My State Only (Faster Delivery)</SelectItem>
                      <SelectItem value="local_city">My City Only (Fastest Delivery)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                  <Label className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2"><Search className="h-5 w-5 text-rose-500"/> Categories of Interest</Label>
                  <p className="text-sm text-slate-500 mb-6">Select at least one category you frequently purchase.</p>
                  <div className="flex flex-wrap gap-3">
                    {['T-Shirts', 'Shirts', 'Jeans', 'Dresses', 'Jackets', 'Pants', 'Activewear', 'Traditional'].map(cat => (
                      <div 
                        key={cat}
                        onClick={() => {
                          setPreferences(prev => ({
                            ...prev,
                            preferredCategories: prev.preferredCategories.includes(cat)
                              ? prev.preferredCategories.filter(c => c !== cat)
                              : [...prev.preferredCategories, cat]
                          }));
                        }}
                        className={`px-5 py-3 rounded-full border text-sm font-semibold cursor-pointer transition-all ${
                          preferences.preferredCategories.includes(cat) 
                            ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handlePreferencesComplete}
                  className="w-full h-14 text-lg font-bold mt-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={preferences.preferredCategories.length === 0}
                >
                  Continue to Next Step
                </Button>
              </div>
            </div>
          )}

          {step === 'agent-selection' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
              <div className="text-center space-y-4 mb-10">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/30 mb-2">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900">Almost Done!</h2>
                <p className="text-slate-500 text-lg">Please select a preferred financial partner for seamless transactions.</p>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="h-6 w-6 text-orange-500" />
                  <h3 className="text-xl font-bold text-slate-900">Financial Partners</h3>
                </div>
                <p className="text-slate-500 mb-8">Access credit and flexible payment terms for your purchases. You can change this later.</p>
                
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <Input 
                    placeholder="Search by company name or city..." 
                    className="h-12 pl-12 bg-slate-50 border-slate-200 rounded-xl text-lg transition-all focus:bg-white focus:border-orange-500 focus:ring-orange-500/20 shadow-sm"
                    value={agentSearchTerm}
                    onChange={(e) => setAgentSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                  {loadingAgents ? (
                    <div className="text-center py-12 text-slate-500 font-medium">Loading premium partners...</div>
                  ) : filteredAgents.length > 0 ? (
                    filteredAgents.map((agent) => (
                      <div 
                        key={agent.id}
                        onClick={() => setSelectedAgentGst(agent.gst)}
                        className={`
                          p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group
                          ${selectedAgentGst === agent.gst 
                            ? 'bg-orange-50/50 border-orange-500 shadow-md' 
                            : 'bg-white border-slate-100 hover:border-orange-200 hover:shadow-md'}
                        `}
                      >
                        <div>
                          <p className={`font-bold text-lg ${selectedAgentGst === agent.gst ? 'text-orange-700' : 'text-slate-900 group-hover:text-orange-600'}`}>{agent.companyName}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                            <MapPin className="h-3.5 w-3.5" /> {agent.city}, {agent.state}
                          </p>
                        </div>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${selectedAgentGst === agent.gst ? 'bg-orange-500 scale-100' : 'bg-slate-100 scale-90 group-hover:bg-orange-100'}`}>
                          <Check className={`h-4 w-4 ${selectedAgentGst === agent.gst ? 'text-white' : 'text-transparent'}`} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-500">No partners found matching your search.</div>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleAgentSelectionComplete} 
                disabled={!selectedAgentGst || isLoading}
                className="w-full h-14 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-orange-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Setting up your dashboard...' : 'Complete Registration'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"""

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(pre_jsx + new_jsx)

    print("Successfully rewritten JSX!")

if __name__ == '__main__':
    rewrite_jsx('src/components/auth/EnhancedRegisterForm.tsx')
