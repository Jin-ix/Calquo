import codecs
import re

file_path = r'e:\B2b-main\calquo1\src\components\auth\EnhancedRegisterForm.tsx'

with open(file_path, 'rb') as f:
    raw = f.read()

encodings = ['utf-8', 'utf-16', 'utf-16-le', 'windows-1252']
content = None
for enc in encodings:
    try:
        content = raw.decode(enc)
        break
    except Exception:
        pass

if not content:
    print("Could not decode")
    exit(1)

# Find the RIGHT PANEL section
pattern = r"(\{\/\*\s*RIGHT PANEL\s*\*\/\}[\s\S]*?)<div\s+className='flex-1 overflow-y-auto'".replace("'", '"')
match = re.search(pattern, content)

if match:
    replacement = '''{/* RIGHT PANEL */}
        <div className="w-full lg:w-7/12 flex flex-col relative" style={{ 
          background: 'url(/bg-registration.png) center/cover fixed', 
          backgroundColor: '#faf8f2',
          minHeight: '100vh' 
        }}>
          {/* Overlay to keep form legible */}
          <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: 'rgba(250, 248, 242, 0.88)' }} />
          
          <div className="sticky top-0 z-50 w-full flex justify-between items-center px-5 py-4" style={{ background: 'rgba(250, 248, 242, 0.6)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(229, 216, 188, 0.5)' }}>
            <button 
              type="button"
              onClick={onBackToLogin}
              className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border border-[#e5d8bc]"
              style={{ color: '#1a1200', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b8860b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              Back to Login
            </button>
            <span className="lg:hidden reg-playfair font-bold" style={{ color: '#1a1200', fontSize: '1.1rem' }}>CALIQUO</span>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto"'''

    new_content = content[:match.start()] + replacement + content[match.end():]
    
    # Also replace the <div className="hidden lg:flex items-center justify-between mb-10">...
    # with one that just says "Step X of X" since the back button is now sticky
    
    pattern2 = r"<div className='hidden lg:flex items-center justify-between mb-10'>[\s\S]*?<span style=\{\{\s*fontSize:\s*'0\.58rem'".replace("'", '"')
    replacement2 = '''<div className="hidden lg:flex items-center justify-end mb-10">
                <span style={{ fontSize: '0.58rem' '''
    
    new_content = re.sub(pattern2, replacement2, new_content)
    
    with open(file_path, 'wb') as f:
        f.write(new_content.encode('utf-8'))
    print("Successfully replaced.")
else:
    print("Could not find RIGHT PANEL")
