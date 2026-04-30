const logger = require('../utils/logger');

/**
 * FhirService — Operates on HL7 FHIR R4 Standards.
 */
class FhirService {
    /**
     * Map a local File record to a FHIR Encounter resource.
     * @param {Object} file 
     * @returns {Object} FHIR Encounter Resource
     */
    mapToEncounter(file) {
        try {
            return {
                resourceType: "Encounter",
                id: file.visit_number,
                status: this.mapStatusToFhir(file.status),
                class: {
                    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                    code: "AMB", // Ambulatory (representative)
                    display: "ambulatory"
                },
                subject: {
                    display: file.patient_name,
                    identifier: {
                        system: "https://ssdms.gov.pk/identifiers/mr-number",
                        value: file.mr_number
                    }
                },
                period: {
                    start: file.created_at,
                    end: file.status === 'Completed' ? file.updated_at : undefined
                },
                extension: [
                    {
                        url: "https://ssdms.gov.pk/fhir/StructureDefinition/priority-score",
                        valueDecimal: file.priority_score
                    },
                    {
                        url: "https://ssdms.gov.pk/fhir/StructureDefinition/current-stage",
                        valueString: file.current_stage
                    }
                ],
                identifier: [
                    {
                        use: "official",
                        system: "https://ssdms.gov.pk/identifiers/visit-number",
                        value: file.visit_number
                    },
                    {
                        use: "secondary",
                        system: "https://ssdms.gov.pk/identifiers/ssc-visit-number",
                        value: file.ssc_visit_number
                    }
                ]
            };
        } catch (err) {
            logger.error(`FHIR Mapping Error for ${file?.visit_number}:`, err);
            return null;
        }
    }

    mapStatusToFhir(status) {
        const map = {
            'In Progress': 'in-progress',
            'Completed': 'finished',
            'Returned': 'onleave',
            'Objected': 'onleave'
        };
        return map[status] || 'planned';
    }
}

module.exports = new FhirService();
