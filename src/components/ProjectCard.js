export default ({ image, title, description, projectLink }) => (
    <div className="rounded-xl overflow-hidden shadow-md w-[400px]">
        <div className="bg-white flex items-center justify-center h-[200px]">
            <img src={image} alt={title} />
        </div>
        <div className="bg-gray-800 text-white p-4">
            <h3 className="text-xl font-bold text-teal-500 mb-2 text-center">{title}</h3>
            <p className="text-gray-400 text-center">{description}</p>
            <div className="flex justify-between text-sm mt-4">
                <a href="#" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">
                    En savoir plus →
                </a>
                <a href={projectLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    Voir le projet
                </a>
            </div>
        </div>
    </div>
);

