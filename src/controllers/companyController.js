const db = require('../config/db');

// Lấy thông tin công ty của nhà tuyển dụng
exports.getMyCompany = async (req, res) => {
    try {
        const [companies] = await db.query('SELECT * FROM companies WHERE owner_id = ?', [req.user.id]);
        if (companies.length === 0) {
            return res.status(404).json({ message: 'Bạn chưa tạo hồ sơ công ty.' });
        }
        res.status(200).json(companies[0]);
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
};

// Tạo hoặc Cập nhật thông tin công ty
exports.createOrUpdateCompany = async (req, res) => {
    try {
        const { name, description, address } = req.body;
        const ownerId = req.user.id;

        const [existingCompanies] = await db.query('SELECT id FROM companies WHERE owner_id = ?', [ownerId]);

        if (existingCompanies.length > 0) {
            // Cập nhật
            const companyId = existingCompanies[0].id;
            await db.query(
                'UPDATE companies SET name = ?, description = ?, address = ? WHERE id = ?',
                [name, description, address, companyId]
            );
            res.status(200).json({ message: 'Cập nhật thông tin công ty thành công.' });
        } else {
            // Tạo mới
            await db.query(
                'INSERT INTO companies (owner_id, name, description, address) VALUES (?, ?, ?, ?)',
                [ownerId, name, description, address]
            );
            res.status(201).json({ message: 'Tạo hồ sơ công ty thành công.' });
        }
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
};

// Cập nhật logo (tương tự avatar)
exports.updateLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn một file ảnh.' });
        }
        const logoUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, "/")}`;

        await db.query('UPDATE companies SET logo_url = ? WHERE owner_id = ?', [logoUrl, req.user.id]);
        res.status(200).json({ message: 'Cập nhật logo thành công.', url: logoUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};