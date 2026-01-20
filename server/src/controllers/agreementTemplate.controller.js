import AgreementTemplate from '../models/agreementTemplate.model.js';

export const createTemplate = async (req, res) => {
    try {
        const { name, lockPeriod, noticePeriod, content } = req.body;

        const template = await AgreementTemplate.create({
            provider: req.user.id,
            name,
            lockPeriod,
            noticePeriod,
            content
        });

        res.status(201).json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyTemplates = async (req, res) => {
    try {
        const templates = await AgreementTemplate.find({ provider: req.user.id }).sort('-createdAt');
        res.status(200).json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTemplateById = async (req, res) => {
    try {
        const template = await AgreementTemplate.findById(req.params.id);
        if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
        res.status(200).json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Template
export const updateTemplate = async (req, res) => {
    try {
        let template = await AgreementTemplate.findById(req.params.id);
        if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
        
        if (template.provider.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        template = await AgreementTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Template
export const deleteTemplate = async (req, res) => {
    try {
        const template = await AgreementTemplate.findById(req.params.id);
        if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
        
        if (template.provider.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await template.deleteOne();
        res.json({ success: true, message: 'Template removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
