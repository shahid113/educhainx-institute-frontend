import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";
import {
    Settings,
    Building2,
    MapPin,
    GraduationCap,
    Layers,
    Image as ImageIcon,
    Save,
    Plus,
    Trash2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function InstituteSettingsPage() {
    const { user, setUser } = useContext(AuthContext);

    const [form, setForm] = useState({
        name: "",
        type: "",
        instituteCode: "",
        email: "",
        address: "",
        district: "",
        state: "",
        country: "",
        degrees: [],
        departments: [],
        logo: "",
    });

    const [newDegree, setNewDegree] = useState("");
    const [newDepartment, setNewDepartment] = useState("");
    const [logoPreview, setLogoPreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState("");

    // Load user profile
    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                type: user.type || "",
                instituteCode: user.instituteCode || "",
                email: user.email || "",
                address: user.address || "",
                district: user.district || "",
                state: user.state || "",
                country: user.country || "India",
                degrees: user.degrees || [],
                departments: user.departments || [],
                logo: user.logo || "",
            });
            setLogoPreview(user.logo || "");
        }
    }, [user]);


    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => {
            setToast("");
        }, 3000); // hide after 3 seconds

        return () => clearTimeout(timer);
    }, [toast]);


    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
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
    };

    const removeDegree = (i) => {
        setForm((prev) => ({
            ...prev,
            degrees: prev.degrees.filter((_, idx) => idx !== i),
        }));
    };

    const addDepartment = () => {
        if (!newDepartment.trim()) return;
        setForm((prev) => ({
            ...prev,
            departments: [...prev.departments, newDepartment.trim()],
        }));
        setNewDepartment("");
    };

    const removeDepartment = (i) => {
        setForm((prev) => ({
            ...prev,
            departments: prev.departments.filter((_, idx) => idx !== i),
        }));
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
        };
        reader.readAsDataURL(file);
    };


    const handleSave = async () => {
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
        } catch (error) {
            console.error(error);
            setToast(error.response?.data?.error || "Update failed.");
        }

        setLoading(false);
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">

            {toast && (
                <div
                    className="fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in"
                >
                    {toast}
                </div>
            )}


            <div className="flex items-center gap-3 mb-4">
                <Settings size={28} className="text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">Institute Settings</h2>
            </div>

            <div className="bg-white rounded-xl shadow p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Building2 className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-700">Basic Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {[
                        { label: "Institute Name", name: "name" },
                        { label: "Institute Type", name: "type" },
                        { label: "Institute Code", name: "instituteCode" },
                        { label: "Email Address", name: "email" },
                    ].map((field) => (
                        <div key={field.name}>
                            <label className="text-sm text-gray-600">{field.label}</label>
                            <input
                                name={field.name}
                                value={form[field.name]}
                                onChange={handleChange}
                                className="w-full border px-3 py-2 rounded mt-1 text-sm"
                            />
                        </div>
                    ))}
                </div>
            </div>


            <div className="bg-white rounded-xl shadow p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <MapPin className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-700">Address Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {[
                        { label: "Full Address", name: "address" },
                        { label: "District", name: "district" },
                        { label: "State", name: "state" },
                        { label: "Country", name: "country" },
                    ].map((field) => (
                        <div key={field.name}>
                            <label className="text-sm text-gray-600">{field.label}</label>
                            <input
                                name={field.name}
                                value={form[field.name]}
                                onChange={handleChange}
                                className="w-full border px-3 py-2 rounded mt-1 text-sm"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <GraduationCap className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-700">Degrees Offered</h3>
                </div>

                <div className="flex gap-2 pt-2">
                    <input
                        type="text"
                        value={newDegree}
                        onChange={(e) => setNewDegree(e.target.value)}
                        className="border px-3 py-2 rounded w-full text-sm"
                        placeholder="Add a new degree..."
                    />
                    <button
                        onClick={addDegree}
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    {form.degrees.map((deg, i) => (
                        <span
                            key={i}
                            className="bg-gray-200 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                        >
                            {deg}
                            <Trash2
                                size={14}
                                className="text-red-600 cursor-pointer"
                                onClick={() => removeDegree(i)}
                            />
                        </span>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Layers className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-700">Departments</h3>
                </div>

                <div className="flex gap-2 pt-2">
                    <input
                        type="text"
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        className="border px-3 py-2 rounded w-full text-sm"
                        placeholder="Add new department..."
                    />
                    <button
                        onClick={addDepartment}
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    {form.departments.map((dep, i) => (
                        <span
                            key={i}
                            className="bg-gray-200 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                        >
                            {dep}
                            <Trash2
                                size={14}
                                className="text-red-600 cursor-pointer"
                                onClick={() => removeDepartment(i)}
                            />
                        </span>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <ImageIcon className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-700">Institute Logo</h3>
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="text-sm"
                    />

                    {logoPreview && (
                        <img
                            src={logoPreview}
                            alt="Logo Preview"
                            className="h-20 w-20 object-cover rounded border shadow"
                        />
                    )}
                </div>
            </div>

            <div className="flex justify-end pb-10">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 shadow-md"
                >
                    <Save size={18} />
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
