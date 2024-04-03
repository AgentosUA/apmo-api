if (not local _this) exitwith {};

removeAllWeapons _this;
removeAllItems _this;
removeAllAssignedItems _this;
removeUniform _this;
removeVest _this;
removeBackpack _this;
removeHeadgear _this;
removeGoggles _this;

_this forceAddUniform 'rhs_uniform_6sh122_gloves_v1';
_this addItemToUniform 'ACE_EarPlugs';
_this addItemToUniform 'ACE_MapTools';
_this addVest 'rhs_6b45_off';
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rgd5';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rgn';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rdg2_white';};
for '_i' from 1 to 5 do { _this addItemToVest 'rhs_30Rnd_545x39_7N22_AK';};
for '_i' from 1 to 2 do { _this addItemToVest 'wog_rhs_30Rnd_545x39_7N10_AK_tracers';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_9x19_17';};
_this addBackpack 'tf_mr6000l';

_this addWeapon 'rhs_weap_ak74m_zenitco01';
_this addPrimaryWeaponItem 'rhs_acc_dtk2';
_this addPrimaryWeaponItem 'rhs_acc_1p29';
_this addPrimaryWeaponItem 'rhs_acc_grip_ffg2';
_this addPrimaryWeaponItem 'rhs_30Rnd_545x39_7N22_AK';
_this addWeapon 'rhs_weap_pya';

_this addHeadgear 'rhs_6b47_bala';

_this linkItem 'ItemMap';
_this linkItem 'ItemCompass';
_this linkItem 'ItemWatch';
_this linkItem 'ItemRadio';
_this linkItem 'ItemGPS';
_this addWeapon '40th_binocular_6x30';