import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { AppInput } from '../../components/common/AppInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { VectorCategoryIcon } from '../../components/illustrations/VectorCategoryIcon';
import { householdApi } from '../../services/api/householdApi';
import { useTranslation } from 'react-i18next';

const VILLAGES = ['Rampur Kalan', 'Lakshmi Nagar', 'Shanti Kunj', 'Kalyanpur', 'Basti Vikas'];

export const AddHouseholdScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [primaryName, setPrimaryName] = useState('');
  const [village, setVillage] = useState('Rampur Kalan');
  const [subArea, setSubArea] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [hasConsent, setHasConsent] = useState(true);

  // Member sub-form
  const [members, setMembers] = useState([]);
  const [memberName, setMemberName] = useState('');
  const [memberAge, setMemberAge] = useState('');
  const [memberGender, setMemberGender] = useState('Female');
  const [memberCategory, setMemberCategory] = useState('Pregnant Woman');
  const [memberRelation, setMemberRelation] = useState('Wife');
  const [showMemberModal, setShowMemberModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddMember = () => {
    if (!memberName.trim() || !memberAge.trim()) {
      Alert.alert('Required', 'Please enter member name and age.');
      return;
    }
    const newMember = {
      id: `mem_${Date.now()}`,
      name: memberName.trim(),
      age: parseInt(memberAge, 10) || 20,
      gender: memberGender,
      category: memberCategory,
      relation: memberRelation,
      is_high_risk: memberCategory === 'Pregnant Woman'
    };
    setMembers([...members, newMember]);
    setMemberName('');
    setMemberAge('');
    setShowMemberModal(false);
  };

  const handleSaveHousehold = async () => {
    if (!primaryName.trim()) {
      setError('Primary contact name is required');
      return;
    }
    if (!contactNumber.trim() || contactNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        primary_contact_name: primaryName.trim(),
        village,
        sub_area: subArea.trim(),
        contact_number: contactNumber.trim(),
        preferred_language: 'hi',
        address: address.trim(),
        consent_status: hasConsent,
        members
      };
      await householdApi.createHousehold(payload);
      setLoading(false);
      Alert.alert(
        'Household Registered',
        `${primaryName} has been successfully registered under ${village}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', 'Could not register household. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title={t('community.addNew') || 'New Household'}
        subtitle="Register a new family in your area"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroup}>
          <Text style={styles.sectionHeader}>Primary Contact Information</Text>

          <AppInput
            label="Primary Contact / Family Head Name *"
            placeholder="e.g. Meena Devi"
            value={primaryName}
            onChangeText={(v) => {
              setPrimaryName(v);
              if (error) setError(null);
            }}
            error={error}
          />

          <Text style={styles.label}>Assigned Village *</Text>
          <View style={styles.villagePillRow}>
            {VILLAGES.map((v) => {
              const isSelected = village === v;
              return (
                <TouchableOpacity
                  key={v}
                  onPress={() => setVillage(v)}
                  style={[styles.villagePill, isSelected && styles.villagePillActive]}
                >
                  <Text style={[styles.villagePillText, isSelected && styles.villagePillTextActive]}>
                    {v}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <AppInput
            label="Ward / Lane / Area"
            placeholder="e.g. Ward 3, Near Primary School"
            value={subArea}
            onChangeText={setSubArea}
          />

          <AppInput
            label="Mobile Number *"
            placeholder="10-digit number"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
          />

          <AppInput
            label="House / Street Address"
            placeholder="e.g. House 14, Gali No. 2"
            value={address}
            onChangeText={setAddress}
          />

          <TouchableOpacity
            onPress={() => setHasConsent(!hasConsent)}
            style={styles.consentRow}
          >
            <Ionicons
              name={hasConsent ? 'checkbox' : 'square-outline'}
              size={18}
              color={colors.primary}
            />
            <Text style={styles.consentText}>
              Household consent obtained for periodic community health visits.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Family Members Section */}
        <View style={[styles.formGroup, { marginTop: spacing.md }]}>
          <View style={styles.memberHeaderRow}>
            <View>
              <Text style={styles.sectionHeader}>Family Members</Text>
              <Text style={styles.sectionSub}>{members.length} added</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowMemberModal(true)}
              style={styles.addMemberBtn}
            >
              <Ionicons name="person-add" size={14} color={colors.primary} />
              <Text style={styles.addMemberText}>+ Add Member</Text>
            </TouchableOpacity>
          </View>

          {members.length === 0 ? (
            <Text style={styles.noMembersText}>
              No family members added yet. Tap '+ Add Member' above.
            </Text>
          ) : (
            members.map((m, idx) => (
              <View key={m.id || idx} style={styles.memberRow}>
                <VectorCategoryIcon category={m.category} size={24} style={{ marginRight: 8 }} />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {m.name} ({m.relation})
                  </Text>
                  <Text style={styles.memberMeta}>
                    {m.age} yrs • {m.gender} • {m.category}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setMembers(members.filter((_, i) => i !== idx))}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* Member Subform inline modal */}
          {showMemberModal && (
            <View style={styles.memberSubForm}>
              <Text style={styles.subFormTitle}>New Family Member</Text>
              <AppInput
                label="Member Name"
                placeholder="e.g. Aarav"
                value={memberName}
                onChangeText={setMemberName}
              />
              <View style={styles.memberInputsRow}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <AppInput
                    label="Age"
                    placeholder="25"
                    value={memberAge}
                    onChangeText={setMemberAge}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppInput
                    label="Relation"
                    placeholder="Wife / Son"
                    value={memberRelation}
                    onChangeText={setMemberRelation}
                  />
                </View>
              </View>

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryRow}>
                {[
                  'Pregnant Woman',
                  'Lactating Mother',
                  'Infant',
                  'Child (1-5)',
                  'Elder',
                  'General'
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setMemberCategory(cat)}
                    style={[styles.catPill, memberCategory === cat && styles.catPillActive]}
                  >
                    <Text
                      style={[styles.catPillText, memberCategory === cat && styles.catPillTextActive]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.subFormBtnRow}>
                <SecondaryButton
                  title="Cancel"
                  onPress={() => setShowMemberModal(false)}
                  variant="outline"
                  size="small"
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <PrimaryButton
                  title="Save Member"
                  onPress={handleAddMember}
                  size="small"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </View>

        <PrimaryButton
          title="Save & Register Household"
          onPress={handleSaveHousehold}
          loading={loading}
          size="large"
          style={{ marginTop: spacing.lg }}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: 40
  },
  formGroup: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs
  },
  sectionSub: {
    ...typography.caption,
    color: colors.textMuted
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  villagePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
    marginTop: spacing.xs
  },
  villagePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  villagePillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  villagePillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  villagePillTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12
  },
  consentText: {
    ...typography.caption,
    color: colors.textPrimary,
    marginLeft: 6,
    flex: 1,
    fontSize: 11
  },
  memberHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight
  },
  addMemberText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: 4,
    fontSize: 11
  },
  noMembersText: {
    ...typography.caption,
    color: colors.textMuted,
    marginVertical: spacing.md,
    textAlign: 'center'
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  memberInfo: {
    flex: 1
  },
  memberName: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary
  },
  memberMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1
  },
  deleteBtn: {
    padding: 6
  },
  memberSubForm: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: 16,
    marginTop: spacing.sm
  },
  subFormTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  memberInputsRow: {
    flexDirection: 'row'
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
    marginTop: spacing.xs
  },
  catPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  catPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  catPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10.5
  },
  catPillTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  subFormBtnRow: {
    flexDirection: 'row',
    marginTop: spacing.xs
  }
});
