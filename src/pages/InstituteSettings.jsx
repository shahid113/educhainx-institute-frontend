import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";
import {
    Settings,
    Building2,
    GraduationCap,
    Layers,
    Image as ImageIcon,
    Plus,
    Trash2,
    RefreshCcw,
    Save,
    X,
    Check,
    Upload,
    AlertCircle,
    Mail,
    Building,
    GraduationCapIcon,
    Users,
    Image
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function InstituteSettingsPage() {
    const { user, setUser } = useContext(AuthContext);

    const [form, setForm] = useState({
        name: "",
        instituteCode: "",
        email: "",
        degrees: [],
        departments: [],
        logo: "",
    });

    const [newDegree, setNewDegree] = useState("");
    const [newDepartment, setNewDepartment] = useState("");
    const [logoPreview, setLogoPreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState("");
    const [activeSection, setActiveSection] = useState('basic');
    const [isDirty, setIsDirty] = useState(false);

    // Load user profile
    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                instituteCode: user.instituteCode || "",
                email: user.email || "",
                degrees: user.degrees || [],
                departments: user.departments || [],
                logo: user.logo || "",
            });

            setLogoPreview(user.logo || "");
        }
    }, [user]);

    // Auto-hide toast message
    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => setToast(""), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        setIsDirty(true);
    };

    // -----------------------------
    // Degree / Department handlers
    // -----------------------------
    const addDegree = () => {
        if (!newDegree.trim()) return;
        setForm((prev) => ({
            ...prev,
            degrees: [...prev.degrees, newDegree.trim()],
        }));
        setNewDegree("");
        setIsDirty(true);
    };

    const removeDegree = (degree) => {
        setForm((prev) => ({
            ...prev,
            degrees: prev.degrees.filter((d) => d !== degree),
        }));
        setIsDirty(true);
    };

    const addDepartment = () => {
        if (!newDepartment.trim()) return;
        setForm((prev) => ({
            ...prev,
            departments: [...prev.departments, newDepartment.trim()],
        }));
        setNewDepartment("");
        setIsDirty(true);
    };

    const removeDepartment = (department) => {
        setForm((prev) => ({
            ...prev,
            departments: prev.departments.filter((d) => d !== department),
        }));
        setIsDirty(true);
    };

    // -----------------------------
    // Logo Upload
    // -----------------------------
    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setForm((prev) => ({ ...prev, logo: reader.result }));
            setLogoPreview(reader.result);
            setIsDirty(true);
        };
        reader.readAsDataURL(file);
    };

    // -----------------------------
    // Update API
    // -----------------------------
    const handleUpdate = async () => {
        setLoading(true);
        setToast("");

        try {
            const res = await axios.patch(
                `${API_URL}/institute/profile`,
                form,
                { withCredentials: true }
            );

            setToast("Profile updated successfully!");
            setUser(res.data.profile);
            setIsDirty(false);
        } catch (error) {
            console.error(error);
            setToast(error.response?.data?.error || "Update failed.");
        }

        setLoading(false);
    };

    const handleCancel = () => {
        if (user) {
            setForm({
                name: user.name || "",
                instituteCode: user.instituteCode || "",
                email: user.email || "",
                degrees: user.degrees || [],
                departments: user.departments || [],
                logo: user.logo || "",
            });
            setLogoPreview(user.logo || "");
        }
        setIsDirty(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6" onKeyDown={handleKeyPress}>
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                    toast.includes('successfully') ? 'bg-green-500' : 'bg-red-500'
                } text-white`}>
                    <div className="flex items-center gap-2">
                        {toast.includes('successfully') ? <Check size={20} /> : <AlertCircle size={20} />}
                        <span>{toast}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Settings size={24} className="text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Institute Settings</h1>
                        <p className="text-gray-600">Manage your institute profile and information</p>
                    </div>
                </div>
                
                {isDirty && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        <AlertCircle size={14} />
                        Unsaved changes
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        {[
                            { id: 'basic', label: 'Basic Info', icon: Building },
                            { id: 'academic', label: 'Academic', icon: GraduationCapIcon },
                            { id: 'logo', label: 'Logo', icon: Image }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id)}
                                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                    activeSection === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {/* Basic Information Section */}
                    {activeSection === 'basic' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { label: "Institute Name", name: "name", icon: Building2, required: true },
                                        { label: "Institute Code", name: "instituteCode", icon: GraduationCap, required: true },
                                        { label: "Email Address", name: "email", icon: Mail, type: "email", required: true },
                                    ].map((field) => (
                                        <div key={field.name} className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <field.icon size={16} />
                                                {field.label}
                                                {field.required && <span className="text-red-500">*</span>}
                                            </label>
                                            <input
                                                type={field.type || "text"}
                                                name={field.name}
                                                value={form[field.name]}
                                                onChange={handleChange}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Academic Information Section */}
                    {activeSection === 'academic' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Degrees Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Degrees Offered</h3>
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newDegree}
                                                onChange={(e) => setNewDegree(e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                placeholder="Add new degree..."
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addDegree();
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={addDegree}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                            >
                                                <Plus size={16} />
                                                Add
                                            </button>
                                        </div>

                                        {form.degrees.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {form.degrees.map((degree, i) => (
                                                    <span
                                                        key={i}
                                                        className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                                    >
                                                        {degree}
                                                        <button
                                                            onClick={() => removeDegree(degree)}
                                                            className="text-blue-600 hover:text-blue-800 transition"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Departments Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Departments</h3>
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newDepartment}
                                                onChange={(e) => setNewDepartment(e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                placeholder="Add new department..."
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addDepartment();
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={addDepartment}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                            >
                                                <Plus size={16} />
                                                Add
                                            </button>
                                        </div>

                                        {form.departments.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {form.departments.map((department, i) => (
                                                    <span
                                                        key={i}
                                                        className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                                                    >
                                                        {department}
                                                        <button
                                                            onClick={() => removeDepartment(department)}
                                                            className="text-green-600 hover:text-green-800 transition"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Logo Upload Section */}
                    {activeSection === 'logo' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Institute Logo</h3>
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="relative">
                                        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50">
                                            {logoPreview ? (
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo Preview"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <ImageIcon size={48} className="text-gray-400" />
                                            )}
                                        </div>
                                        {logoPreview && (
                                            <button
                                                onClick={() => {
                                                    setForm(prev => ({ ...prev, logo: "" }));
                                                    setLogoPreview("");
                                                    setIsDirty(true);
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="text-center">
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="hidden"
                                            />
                                            <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                                                <Upload size={16} />
                                                Upload Logo
                                            </div>
                                        </label>
                                        <p className="text-sm text-gray-500 mt-2">
                                            PNG, JPG, or SVG (Max 2MB)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                        {isDirty && (
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                            >
                                <X size={16} />
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handleUpdate}
                            disabled={!isDirty || loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            <Save size={16} />
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}