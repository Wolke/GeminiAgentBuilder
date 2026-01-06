import { memo } from 'react';
import type { ConditionNodeData } from '../../../models/types';
import { GEMINI_MODELS } from '../../../models/types';

interface ConditionNodeFormProps {
    data: ConditionNodeData;
    onChange: (data: Partial<ConditionNodeData>) => void;
}

export const ConditionNodeForm = memo(({ data, onChange }: ConditionNodeFormProps) => {
    const categories = data.categories || [];

    const handleAddCategory = () => {
        onChange({ categories: [...categories, `Category ${categories.length + 1}`] });
    };

    const handleCategoryChange = (index: number, value: string) => {
        const newCategories = [...categories];
        newCategories[index] = value;
        onChange({ categories: newCategories });
    };

    const handleDeleteCategory = (index: number) => {
        const newCategories = categories.filter((_, i) => i !== index);
        onChange({ categories: newCategories });
    };

    return (
        <>
            <div className="form-group">
                <label>Model</label>
                <select
                    value={data.model}
                    onChange={(e) => onChange({ model: e.target.value as any })}
                >
                    {GEMINI_MODELS.map((model) => (
                        <option key={model} value={model}>
                            {model}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Classification Categories</label>
                <div className="category-list">
                    {categories.map((category, index) => (
                        <div key={index} className="category-item">
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => handleCategoryChange(index, e.target.value)}
                                placeholder="Category Name"
                            />
                            <button
                                className="icon-btn delete-btn"
                                onClick={() => handleDeleteCategory(index)}
                                title="Remove Category"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button className="add-btn" onClick={handleAddCategory}>
                        + Add Category
                    </button>
                </div>
            </div>

            <div className="form-group">
                <label>Instructions</label>
                <textarea
                    rows={4}
                    value={data.instructions || ''}
                    onChange={(e) => onChange({ instructions: e.target.value })}
                    placeholder="Classify the input based on..."
                    className="code-input"
                />
            </div>
        </>
    );
});
