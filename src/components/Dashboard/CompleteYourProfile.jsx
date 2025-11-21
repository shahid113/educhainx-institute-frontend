import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import {
    User,
    Building2,
    GraduationCap,
    Layers,
    Image as ImageIcon,
    Plus,
    Trash2,
    X,
    Check,
    Upload,
    AlertCircle,
    Mail,
    Building,
    GraduationCapIcon,
    Users,
    Image,
    Settings,
    CheckCircle,
    Sparkles,
    Edit3
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

// Complete Your Profile Component
export function CompleteYourProfile() {
    const { user, setUser } = useContext(AuthContext);
    const [showPopup, setShowPopup] = useState(false);
    const [currentField, setCurrentField] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState("");
    const [hasCheckedOnLogin, setHasCheckedOnLogin] = useState(false);

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
    const [isDirty, setIsDirty] = useState(false);

    // Check if profile is incomplete on login (only once)
    useEffect(() => {
        if (user && !hasCheckedOnLogin) {
            setHasCheckedOnLogin(true);
            const incompleteFields = [];
            if (!user.name) incompleteFields.push('name');
            if (!user.instituteCode) incompleteFields.push('instituteCode');
            if (!user.email) incompleteFields.push('email');
            if (!user.degrees || user.degrees.length === 0) incompleteFields.push('degrees');
            if (!user.departments || user.departments.length === 0) incompleteFields.push('departments');
            if (!user.logo) incompleteFields.push('logo');

            if (incompleteFields.length > 0) {
                setShowPopup(true);
                // Set the order: logo first, then degrees, then departments, then other fields
                const fieldOrder = ['logo', 'degrees', 'departments', 'name', 'instituteCode', 'email'];
                const nextField = fieldOrder.find(field => incompleteFields.includes(field));
                setCurrentField(nextField);
                
                // Initialize form with existing data
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
        }
    }, [user, hasCheckedOnLogin]);

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

    const handleUpdate = async (field) => {
        setLoading(true);
        setToast("");

        try {
            const updateData = { [field]: form[field] };
            if (field === 'degrees' || field === 'departments') {
                updateData[field] = form[field];
            }

            const res = await axios.patch(
                `${API_URL}/institute/profile`,
                updateData,
                { withCredentials: true }
            );

            setToast(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);
            setUser(res.data.profile);
            
            // Move to next incomplete field in the desired order
            const nextField = getNextIncompleteField(field);
            if (nextField) {
                setCurrentField(nextField);
            } else {
                setShowPopup(false);
            }
        } catch (error) {
            console.error(error);
            setToast(error.response?.data?.error || "Update failed.");
        }

        setLoading(false);
    };

    const getNextIncompleteField = (currentField) => {
        // Define the preferred order: logo, degrees, departments, then other fields
        const fieldOrder = ['logo', 'degrees', 'departments', 'name', 'instituteCode', 'email'];
        const currentIndex = fieldOrder.indexOf(currentField);
        
        for (let i = currentIndex + 1; i < fieldOrder.length; i++) {
            const field = fieldOrder[i];
            if (!user?.[field] || (field === 'degrees' && (!user.degrees || user.degrees.length === 0)) || 
                (field === 'departments' && (!user.departments || user.departments.length === 0)) ||
                (field === 'logo' && !user.logo)) {
                return field;
            }
        }
        return null;
    };

    const handleSkip = () => {
        const nextField = getNextIncompleteField(currentField);
        if (nextField) {
            setCurrentField(nextField);
        } else {
            setShowPopup(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            setForm(prev => ({
                ...prev,
                [currentField]: user[currentField] || (currentField === 'degrees' || currentField === 'departments' ? [] : "")
            }));
            if (currentField === 'logo') {
                setLogoPreview(user.logo || "");
            }
        }
        setIsDirty(false);
    };

    const handleSkipAll = () => {
        setShowPopup(false);
    };

    // Get incomplete fields
    const getIncompleteFields = () => {
        const fields = [];
        if (!user?.name) fields.push({ id: 'name', label: 'Institute Name', icon: Building2 });
        if (!user?.instituteCode) fields.push({ id: 'instituteCode', label: 'Institute Code', icon: GraduationCap });
        if (!user?.email) fields.push({ id: 'email', label: 'Email Address', icon: Mail });
        if (!user?.degrees || user.degrees.length === 0) fields.push({ id: 'degrees', label: 'Degrees Offered', icon: GraduationCapIcon });
        if (!user?.departments || user.departments.length === 0) fields.push({ id: 'departments', label: 'Departments', icon: Users });
        if (!user?.logo) fields.push({ id: 'logo', label: 'Logo', icon: Image });
        return fields;
    };

    const incompleteFields = getIncompleteFields();
    const currentFieldInfo = incompleteFields.find(f => f.id === currentField);

    if (!showPopup || !currentField) return null;

    return (
        <>
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-slide-in-right ${
                    toast.includes('successfully') ? 'bg-green-500' : 'bg-red-500'
                } text-white z-50`}>
                    <div className="flex items-center gap-2">
                        {toast.includes('successfully') ? <Check size={20} /> : <AlertCircle size={20} />}
                        <span>{toast}</span>
                    </div>
                </div>
            )}

            {/* Complete Your Profile Popup */}
            <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-500 animate-scale-in">
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-90"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <Edit3 size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">Complete Profile</h2>
                                        <p className="text-blue-100 text-xs">{incompleteFields.length - incompleteFields.findIndex(f => f.id === currentField) - 1} remaining</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSkipAll}
                                    className="p-1 hover:bg-white/20 rounded-lg transition backdrop-blur-sm"
                                >
                                    <X size={16} className="text-white" />
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span>Progress</span>
                                    <span>{Math.round(((6 - incompleteFields.length) + incompleteFields.findIndex(f => f.id === currentField) + 1) / 6 * 100)}%</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-1.5 backdrop-blur-sm">
                                    <div 
                                        className="bg-white h-1.5 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${((incompleteFields.findIndex(f => f.id === currentField) + 1) / incompleteFields.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Current Field Content */}
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <currentFieldInfo.icon size={20} className="text-blue-600" />
                            <h3 className="font-semibold text-gray-900">{currentFieldInfo.label}</h3>
                        </div>

                        {/* Field-specific forms */}
                        {currentField === 'name' && (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                    placeholder="Enter institute name"
                                    autoFocus
                                />
                            </div>
                        )}

                        {currentField === 'instituteCode' && (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    name="instituteCode"
                                    value={form.instituteCode}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                    placeholder="Enter institute code"
                                    autoFocus
                                />
                            </div>
                        )}

                        {currentField === 'email' && (
                            <div className="space-y-3">
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                    placeholder="Enter email address"
                                    autoFocus
                                />
                            </div>
                        )}

                        {currentField === 'degrees' && (
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newDegree}
                                            onChange={(e) => setNewDegree(e.target.value)}
                                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                            placeholder="Add new degree..."
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    addDegree();
                                                }
                                            }}
                                            autoFocus
                                        />
                                        <button
                                            onClick={addDegree}
                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-1"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    {form.degrees.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {form.degrees.map((degree, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                                                >
                                                    {degree}
                                                    <button
                                                        onClick={() => removeDegree(degree)}
                                                        className="text-blue-600 hover:text-blue-800 transition"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentField === 'departments' && (
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newDepartment}
                                            onChange={(e) => setNewDepartment(e.target.value)}
                                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                            placeholder="Add new department..."
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    addDepartment();
                                                }
                                            }}
                                            autoFocus
                                        />
                                        <button
                                            onClick={addDepartment}
                                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center gap-1"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    {form.departments.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {form.departments.map((department, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                                                >
                                                    {department}
                                                    <button
                                                        onClick={() => removeDepartment(department)}
                                                        className="text-green-600 hover:text-green-800 transition"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentField === 'logo' && (
                            <div className="flex flex-col items-center space-y-3">
                                <div className="relative group">
                                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 group-hover:border-blue-400 transition-all duration-200">
                                        {logoPreview ? (
                                            <img
                                                src={logoPreview}
                                                alt="Logo Preview"
                                                className="w-full h-full object-contain animate-fade-in"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <ImageIcon size={24} className="text-gray-400 mx-auto mb-1" />
                                                <p className="text-xs text-gray-500">No logo</p>
                                            </div>
                                        )}
                                    </div>
                                    {logoPreview && (
                                        <button
                                            onClick={() => {
                                                setForm(prev => ({ ...prev, logo: "" }));
                                                setLogoPreview("");
                                                setIsDirty(true);
                                            }}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition shadow-lg"
                                        >
                                            <X size={12} />
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
                                        <div className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 text-xs">
                                            <Upload size={12} />
                                            Upload
                                        </div>
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        PNG, JPG, SVG (Max 2MB)
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-200">
                        <button
                            onClick={handleSkip}
                            className="text-sm text-gray-600 hover:text-gray-800 transition"
                        >
                            Skip this field
                        </button>
                        <div className="flex gap-2">
                            {isDirty && (
                                <button
                                    onClick={handleCancel}
                                    className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition text-xs font-medium"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={() => handleUpdate(currentField)}
                                disabled={!isDirty || loading}
                                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs font-medium flex items-center gap-1 shadow-lg"
                            >
                                <Check size={14} />
                                {loading ? "Saving..." : "Save & Next"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes scale-in {
                    from {
                        transform: scale(0.9) translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-scale-in {
                    animation: scale-in 0.3s ease-out;
                }
                
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
                
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </>
    );
}