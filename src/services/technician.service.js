const { PutCommand, GetCommand, } = require("@aws-sdk/lib-dynamodb");
const dynamo = require("../config/dynamodb");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


exports.registerTechnician = async (data) => {
    try {
        if (!data.name) {
            throw new Error("Name is required");
        }

        if (!data.mobile_number) {
            throw new Error("Mobile number is required");
        }

        const technician = {
            technician_id: `tech_${Date.now()}`,

            name: data.name,
            mobile_number: data.mobile_number,
            email: data.email || "",

            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            pincode: data.pincode || "",

            date_of_birth: data.date_of_birth || "",
            experience_years: Number(data.experience_years || 0),
            specialization: data.specialization || "",
            certifications: data.certifications || "",
            previous_company: data.previous_company || "",
            availability: data.availability || "",

            police_verification: data.police_verification || false,
            has_mobile_device: data.has_mobile_device || false,
            has_vehicle_license: data.has_vehicle_license || false,

            password: null,
            mustCreatePassword: true,

            registration_status: "PENDING",

            approvedBy: null,
            approvedAt: null,
            rejectionReason: null,

            assignedPlantCount: 0,
            completedVisitCount: 0,

            isActive: false,

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await dynamo.send(
            new PutCommand({
                TableName: process.env.TECHNICIANS_TABLE,
                Item: technician,
            })
        );

        return technician;
    } catch (error) {
        console.error(
            "REGISTER TECHNICIAN SERVICE ERROR",
            error
        );
        throw error;
    }
};

exports.loginTechnician = async (
    technician_id,
    password
) => {
    try {
        const result = await dynamo.send(
            new GetCommand({
                TableName:
                    process.env.TECHNICIANS_TABLE,
                Key: {
                    technician_id,
                },
            })
        );

        const technician = result.Item;

        if (!technician) {
            throw new Error(
                "Technician not found"
            );
        }

        if (
            technician.registration_status !==
            "APPROVED"
        ) {
            throw new Error(
                "Technician is not approved"
            );
        }

        if (!technician.isActive) {
            throw new Error(
                "Technician account inactive"
            );
        }

        const isValidPassword =
            await bcrypt.compare(
                password,
                technician.password
            );

        if (!isValidPassword) {
            throw new Error(
                "Invalid credentials"
            );
        }

        const token = jwt.sign(
            {
                technician_id:
                    technician.technician_id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        delete technician.password;

        return {
            token,
            technician,
        };
    } catch (error) {
        console.error(
            "LOGIN TECHNICIAN ERROR",
            error
        );

        throw error;
    }
};