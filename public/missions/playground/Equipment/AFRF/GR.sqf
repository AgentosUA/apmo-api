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
_this addVest 'rhs_6b45_rifleman_2';
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rgd5';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rgn';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rdg2_white';};
for '_i' from 1 to 5 do { _this addItemToVest 'rhs_30Rnd_545x39_7N22_AK';};
for '_i' from 1 to 2 do { _this addItemToVest 'wog_rhs_30Rnd_545x39_7N10_AK_tracers';};
_this addBackpack 'CUP_O_RUS_Patrol_bag_Summer';
for '_i' from 1 to 8 do { _this addItemToBackpack  'rhs_VOG25';};
for '_i' from 1 to 4 do { _this addItemToBackpack  'rhs_VOG25P';};
for '_i' from 1 to 4 do { _this addItemToBackpack  'rhs_VG40TB';};
for '_i' from 1 to 4 do { _this addItemToBackpack  'rhs_GDM40';};
for '_i' from 1 to 2 do { _this addItemToBackpack  'rhs_GRD40_White';};
for '_i' from 1 to 2 do { _this addItemToBackpack  'rhs_GRD40_Green';};
for '_i' from 1 to 2 do { _this addItemToBackpack  'rhs_GRD40_Red';};

_this addWeapon 'rhs_weap_ak74m_gp25';
_this addPrimaryWeaponItem 'rhs_acc_dtk2';
_this addPrimaryWeaponItem 'rhs_30Rnd_545x39_7N22_AK';

_this addHeadgear 'rhs_6b47_bala';

_this linkItem 'ItemMap';
_this linkItem 'ItemCompass';
_this linkItem 'ItemGPS';
_this linkItem 'ItemRadio';