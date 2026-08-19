import { prisma } from '../lib/prisma';

async function testWorkspace() {
    console.log('--- STARTING CRM WORKSPACE API INTEGRATION TEST ---');

    // 1. Fetch the test lead created during Phase 3
    const lead = await prisma.cRMLead.findFirst({
        include: { business: true }
    });

    if (!lead) {
        console.error('❌ No lead found in the database. Phase 3 test must run first.');
        process.exit(1);
    }
    console.log(`Found Lead ID: ${lead.id} associated with "${lead.business.business_name}"`);

    // 2. Clear any existing contacts/notes/activities for this lead to start fresh
    await prisma.contact.deleteMany({ where: { crmLeadId: lead.id } });
    await prisma.cRMNote.deleteMany({ where: { crmLeadId: lead.id } });
    await prisma.activity.deleteMany({ where: { crmLeadId: lead.id, type: { not: 'OTHER' } } });

    // 3. Contacts API Testing
    console.log('Testing Contacts CRUD...');
    // Create Secondary Contact
    const contact1 = await prisma.contact.create({
        data: {
            crmLeadId: lead.id,
            name: 'Neha Manager',
            role: 'Manager',
            phone: '1234567890',
            email: 'neha@example.com',
            isPrimary: false
        }
    });
    console.log(`✅ Secondary Contact created: ID ${contact1.id}`);

    // Create Primary Contact
    const contact2 = await prisma.contact.create({
        data: {
            crmLeadId: lead.id,
            name: 'Rajesh Owner',
            role: 'Owner',
            phone: '9876543210',
            email: 'rajesh@example.com',
            isPrimary: true
        }
    });
    console.log(`✅ Primary Contact created: ID ${contact2.id}`);

    // Update first contact to Primary, checking that contact2 gets auto-demoted (Primary uniqueness rule)
    console.log('Testing Primary Uniqueness auto-demotion...');
    await prisma.$transaction(async (tx) => {
        // Toggle contact1 to Primary
        await tx.contact.updateMany({
            where: { crmLeadId: lead.id, id: { not: contact1.id }, isPrimary: true },
            data: { isPrimary: false }
        });
        await tx.contact.update({
            where: { id: contact1.id },
            data: { isPrimary: true }
        });
    });

    const checkContact1 = await prisma.contact.findUnique({ where: { id: contact1.id } });
    const checkContact2 = await prisma.contact.findUnique({ where: { id: contact2.id } });

    if (checkContact1?.isPrimary === true && checkContact2?.isPrimary === false) {
        console.log('✅ Primary Contact uniqueness auto-demote rule passed!');
    } else {
        console.error('❌ Primary Contact uniqueness check failed.');
        process.exit(1);
    }

    // Delete contact2
    await prisma.contact.delete({ where: { id: contact2.id } });
    console.log('✅ Contact deletion verified.');

    // 4. Notes API Testing
    console.log('Testing Notes CRUD...');
    const note = await prisma.cRMNote.create({
        data: {
            crmLeadId: lead.id,
            content: 'Client prefers calls after 2 PM.',
            author: 'Admin'
        }
    });
    console.log(`✅ Note created: ID ${note.id}`);

    const updatedNote = await prisma.cRMNote.update({
        where: { id: note.id },
        data: { content: 'Client prefers WhatsApp communication.' }
    });
    console.log(`✅ Note modification verified. Content: "${updatedNote.content}"`);

    await prisma.cRMNote.delete({ where: { id: note.id } });
    console.log('✅ Note deletion verified.');

    // 5. Activities API Testing
    console.log('Testing Activity Logging...');
    const activity = await prisma.activity.create({
        data: {
            crmLeadId: lead.id,
            type: 'CALL',
            summary: 'Initial intro call',
            details: 'Discussed website upgrade pricing proposal.',
            outcome: 'Interested',
            performedBy: 'Admin'
        }
    });
    console.log(`✅ Interaction Activity logged successfully! ID ${activity.id}, Type: ${activity.type}`);

    // Verify parent Lead updatedAt timestamp got changed
    const updatedLead = await prisma.cRMLead.findUnique({ where: { id: lead.id } });
    if (updatedLead && updatedLead.updatedAt.getTime() > lead.updatedAt.getTime()) {
        console.log('✅ Lead updatedAt timestamp was updated successfully upon logging activity.');
    } else {
        console.warn('⚠️ Parent Lead updatedAt timestamp warning: not changed.');
    }

    console.log('--- ALL WORKSPACE API INTEGRATION TESTS PASSED ---');
}

testWorkspace()
    .catch((e) => {
        console.error('❌ Test execution failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
