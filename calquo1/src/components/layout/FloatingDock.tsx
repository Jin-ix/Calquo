import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Home, Package, ShoppingBag, ShoppingCart } from 'lucide-react';
import { Badge } from '../ui/badge';

interface FloatingDockProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  cartItemCount?: number;
}

export function FloatingDock({ currentPage, onNavigate, cartItemCount = 0 }: FloatingDockProps) {
  // Define only the core 3 items + Cart (optional if we want it)
  // Based on user request: Home, Browse, My Orders
  const items = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'browse', label: 'Browse', icon: Package },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, badge: cartItemCount },
  ];

  const mouseX = useMotionValue(Infinity);

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="pointer-events-auto flex h-16 items-end gap-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/20 px-4 pb-3 pt-3 shadow-2xl hover:bg-black/90 transition-colors"
      >
        {items.map((item) => (
          <DockIcon
            key={item.id}
            mouseX={mouseX}
            item={item}
            isActive={currentPage === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </motion.div>
    </div>
  );
}

function DockIcon({
  mouseX,
  item,
  isActive,
  onClick,
}: {
  mouseX: any;
  item: any;
  isActive: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 70, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="relative group focus:outline-none flex flex-col items-center justify-end"
    >
      <motion.div
        style={{ width, height: width }}
        className={`flex items-center justify-center rounded-full transition-colors relative
          ${isActive ? 'bg-white text-black' : 'bg-white/10 text-white/70 group-hover:bg-white/20 group-hover:text-white'}
        `}
      >
        <item.icon className="w-1/2 h-1/2" />
        {item.badge > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white border-0 flex items-center justify-center p-0 text-[10px]">
             {item.badge > 99 ? '99+' : item.badge}
          </Badge>
        )}
      </motion.div>
      
      {/* Tooltip */}
      <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform origin-bottom px-3 py-1 bg-black/90 border border-white/10 text-white text-xs rounded-md shadow-lg pointer-events-none whitespace-nowrap hidden md:block">
        {item.label}
      </div>

       {/* Active dot */}
       {isActive && (
         <motion.div
           layoutId="dock-indicator"
           className="w-1 h-1 bg-white rounded-full absolute -bottom-2"
           transition={{ type: "spring", stiffness: 400, damping: 25 }}
         />
       )}
    </button>
  );
}
