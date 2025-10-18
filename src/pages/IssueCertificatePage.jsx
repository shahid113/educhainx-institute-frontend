import CertificateForm from "../components/Dashboard/CertificateForm";

const IssueCertificatePage = () => {
  return (
    <div className="bg-white/70 p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Issue New Certificate
      </h2>
      <CertificateForm />
    </div>
  );
};

export default IssueCertificatePage;
