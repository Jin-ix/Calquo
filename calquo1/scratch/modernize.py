import re
import sys

def modernize_form(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Layout changes
    content = content.replace('bg-slate-50', 'bg-zinc-950 text-slate-200')
    
    # Left panel updates (keep it dark and sleek)
    content = content.replace('bg-slate-900 sticky', 'bg-zinc-950 sticky border-r border-white/5')
    
    # Text colors
    content = content.replace('text-slate-900', 'text-white')
    content = content.replace('text-slate-700', 'text-white/80')
    content = content.replace('text-slate-600', 'text-white/70')
    content = content.replace('text-slate-500', 'text-white/50')
    content = content.replace('text-slate-400', 'text-white/40')
    
    # Borders
    content = content.replace('border-slate-200', 'border-white/10')
    content = content.replace('border-slate-100', 'border-white/5')
    content = content.replace('border-slate-300', 'border-white/20')
    
    # Inputs & Selects
    content = content.replace('bg-white border-slate-200', 'bg-white/5 border-white/10 backdrop-blur-md text-white placeholder:text-white/30 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl transition-all')
    content = content.replace('bg-white', 'bg-white/5')
    
    # Buttons (Primary)
    content = content.replace('bg-slate-900 hover:bg-slate-800', 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 shadow-lg shadow-orange-500/25 border-0')
    content = content.replace('bg-black hover:bg-slate-800', 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 shadow-lg shadow-orange-500/25 border-0 text-white')
    content = content.replace('bg-slate-900 text-white', 'bg-gradient-to-r from-orange-500 to-rose-500 text-white border-0 shadow-md shadow-orange-500/20')
    
    # Status badges / backgrounds
    content = content.replace('bg-green-50', 'bg-green-500/10')
    content = content.replace('border-green-200', 'border-green-500/20')
    content = content.replace('text-green-700', 'text-green-400')
    content = content.replace('text-green-600', 'text-green-400')
    
    content = content.replace('bg-orange-50/50', 'bg-orange-500/5')
    content = content.replace('bg-orange-50', 'bg-orange-500/10')
    content = content.replace('bg-orange-100', 'bg-orange-500/20')
    content = content.replace('border-orange-100', 'border-orange-500/20')
    content = content.replace('border-orange-200', 'border-orange-500/30')
    content = content.replace('border-orange-300', 'border-orange-500/40')
    content = content.replace('text-orange-600', 'text-orange-400')
    content = content.replace('text-orange-500', 'text-orange-400')
    
    # Mobile header background
    content = content.replace('bg-white flex items-center', 'bg-zinc-950 flex items-center border-white/5 text-white')
    
    # Preference Cards & categories
    content = content.replace('bg-slate-100', 'bg-white/10')
    content = content.replace('bg-black text-white', 'bg-gradient-to-r from-orange-500 to-rose-500 text-white border-0 shadow-lg shadow-orange-500/20')
    
    # Add rounded-2xl to cards
    content = content.replace('Card className="border-slate-200"', 'Card className="bg-white/5 border-white/10 backdrop-blur-md rounded-2xl shadow-xl"')
    content = content.replace('Card className="border-orange-200 bg-orange-50/50"', 'Card className="bg-orange-500/5 border-orange-500/20 backdrop-blur-md rounded-2xl shadow-xl"')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print("Successfully modernized form!")

if __name__ == '__main__':
    modernize_form('src/components/auth/EnhancedRegisterForm.tsx')
