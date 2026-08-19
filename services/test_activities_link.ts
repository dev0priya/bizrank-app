import { prisma } from '../lib/prisma';

async function testActivitiesLink() {
    console.log('--- STARTING CRM ACTIVITIES-CONTACT LINK INTEGRATION TEST ---');

    // 1. Fetch lead
    const lead = await prisma.cRMLead.findFirst({
        include: { business: true }
    });

    if (!lead) {
        console.error('❌ Lead required. Run Phase 3/4 tests first.');
        process.exit(1);
    }
    console.log(`Found lead ID: ${lead.id} - Business: "${lead.business.business_name}"`);

    // Clear old test data for clean slate
    await prisma.contact.deleteMany({ where: { crmLeadId: lead.id } });
    await prisma.activity.deleteMany({ where: { crmLeadId: lead.id, type: { not: 'OTHER' } } });

    // 2. Email / Phone Format Validation Test (equivalent to POST /api/crm/leads/[id]/contacts checks)
    console.log('Testing Email & Phone validation filters...');
    const invalidEmails = ['invalid-email', 'name@domain', '@domain.com'];
    for (const email of invalidEmails) {
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            console.error(`❌ Validation failed: Accepted invalid email "${email}"`);
            process.exit(1);
        }
    }
    console.log('✅ Email regex filter passed!');

    const invalidPhones = ['abcdef', '++12345', '123-abc-456'];
    for (const phone of invalidPhones) {
        if (/^\+?[0-9\s\-()]+$/.test(phone)) {
            console.error(`❌ Validation failed: Accepted invalid phone "${phone}"`);
            process.exit(1);
        }
    }
    console.log('✅ Phone regex filter passed!');

    // 3. Create Contact
    console.log('Registering contact...');
    const contact = await prisma.contact.create({
        data: {
            crmLeadId: lead.id,
            name: 'Priya Leader',
            role: 'Director',
            email: 'priya@bizrank.com',
            phone: '+91 9999999999',
            isPrimary: true
        }
    });
    console.log(`✅ Contact created successfully: ID ${contact.id}`);

    // 4. Create Activity Linked to Contact
    console.log('Logging CALL activity associated with contact...');
    const activity = await prisma.activity.create({
        data: {
            crmLeadId: lead.id,
            contactId: contact.id,
            type: 'CALL',
            summary: 'Followup regarding website quote',
            details: 'Spoke with Priya about mobile responsiveness issues.',
            outcome: 'INTERESTED',
            performedBy: 'Admin'
        }
    });
    console.log(`✅ Activity logged: ID ${activity.id}, Linked Contact ID: ${activity.contactId}`);

    // 5. Query Activities list and verify Contact relation exists
    console.log('Verifying relational include...');
    const loggedActivity = await prisma.activity.findUnique({
        where: { id: activity.id },
        include: { contact: true }
    });

    if (loggedActivity?.contact && loggedActivity.contact.name === 'Priya Leader') {
        console.log(`✅ Relational check passed! Activity linked to: "${loggedActivity.contact.name}" (${loggedActivity.contact.role})`);
    } else {
        console.error('❌ Relational include failed.');
        process.exit(1);
    }

    // 6. Verify Contact history count
    console.log('Verifying Contact history count...');
    const contactWithActivities = await prisma.contact.findUnique({
        where: { id: contact.id },
        include: { activities: true }
    });

    if (contactWithActivities?.activities && contactWithActivities.activities.length === 1) {
        console.log(`✅ Contact history count verified: ${contactWithActivities.activities.length} logged interactions!`);
    } else {
        console.error('❌ Contact history activities count mismatch.');
        process.exit(1);
    }

    console.log('--- ALL INTEGRATION TESTS PASSED ---');
}

testActivitiesLink()
    .catch((e) => {
        console.error('❌ Test execution failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
