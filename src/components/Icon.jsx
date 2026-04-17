import React from 'react';
import { 
    LayoutDashboard, 
    Package, 
    Users, 
    Truck, 
    FileText, 
    Settings, 
    LogOut, 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Upload, 
    Download, 
    AlertTriangle, 
    AlertCircle, 
    ArrowUpCircle, 
    ArrowDownCircle, 
    DollarSign, 
    Layers, 
    Check, 
    X,
    Edit3,
    Camera
} from 'lucide-react';

const icons = {
    'dashboard': LayoutDashboard,
    'products': Package,
    'users': Users,
    'suppliers': Truck,
    'containers': Truck,
    'import-nfe': FileText,
    'settings': Settings,
    'logout': LogOut,
    'plus': Plus,
    'search': Search,
    'edit-2': Edit2,
    'trash-2': Trash2,
    'upload': Upload,
    'download': Download,
    'alert-triangle': AlertTriangle,
    'alert-circle': AlertCircle,
    'arrow-up-circle': ArrowUpCircle,
    'arrow-down-circle': ArrowDownCircle,
    'dollar-sign': DollarSign,
    'layers': Layers,
    'check': Check,
    'x': X,
    'edit-3': Edit3,
    'camera': Camera
};

export const Icon = ({ name, size = 20, className = "" }) => {
    const LucideIcon = icons[name] || AlertCircle;
    return <LucideIcon size={size} className={className} />;
};
