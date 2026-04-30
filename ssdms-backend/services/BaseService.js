class BaseService {
    constructor(repository) {
        this.repository = repository;
    }

    async getAll(filters, options) {
        return await this.repository.findAll(filters, options);
    }

    async getById(id, idColumn) {
        return await this.repository.findById(id, idColumn);
    }

    async create(data) {
        return await this.repository.create(data);
    }

    async update(id, data, idColumn) {
        return await this.repository.update(id, data, idColumn);
    }

    async delete(id, idColumn, softDelete) {
        return await this.repository.delete(id, idColumn, softDelete);
    }
}

module.exports = BaseService;
