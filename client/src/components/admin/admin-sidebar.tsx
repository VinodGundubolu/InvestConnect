import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  CreditCard, 
  Calculator,
  FileText,
  User,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Investors",
    href: "/admin/investors",
    icon: Users,
  },
  {
    name: "Bond Management",
    href: "/admin/bonds",
    icon: TrendingUp,
  },
  {
    name: "Transactions",
    href: "/admin/transactions",
    icon: CreditCard,
  },
  {
    name: "Returns Calculator",
    href: "/admin/calculator",
    icon: Calculator,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: FileText,
  },
];

interface AdminSidebarProps {
  className?: string;
}

export default function AdminSidebar({ className }: AdminSidebarProps) {
  const [location] = useLocation();

  return (
    <div className={`bg-gradient-to-b from-blue-500 to-cyan-500 text-white min-h-screen w-64 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-blue-400">
        <div className="flex items-center space-x-3">
          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">IRM System</h1>
            <p className="text-blue-100 text-sm">Investor Relations</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/admin" && location.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a 
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? "bg-white bg-opacity-20 text-white shadow-md" 
                        : "text-blue-100 hover:bg-white hover:bg-opacity-10 hover:text-white"
                    }`}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Admin User Section */}
      <div className="p-4 border-t border-blue-400">
        <div className="flex items-center space-x-3 px-4 py-3 bg-white bg-opacity-10 rounded-lg">
          <div className="bg-green-500 p-2 rounded-full">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Admin User</div>
            <div className="text-xs text-blue-100">Portfolio Manager</div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          className="w-full mt-3 text-blue-100 hover:bg-white hover:bg-opacity-10 hover:text-white"
          onClick={() => window.location.href = '/api/logout'}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}