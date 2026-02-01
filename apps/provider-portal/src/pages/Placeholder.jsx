const Placeholder = ({ title }) => {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">{title}</h1>
            <div className="bg-white border border-neutral-200 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-neutral-400">
                <span className="text-lg font-medium">Under Construction</span>
                <p>This module is part of the Provider Portal Revamp.</p>
            </div>
        </div>
    );
};

export default Placeholder;
