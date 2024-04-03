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
_this addVest 'CUP_Vest_RUS_6B45_Sh117_VOG_Green';
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rgd5';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rgn';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rdg2_white';};
for '_i' from 1 to 2 do { _this addItemToVest 'wog_mag_rdgm_white';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_9x19_17';};
for '_i' from 1 to 4 do { _this addItemToVest 'grcb_30Rnd_762x39mm_polymer_7N23';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_30Rnd_762x39mm_polymer_tracer';};
_this addBackpack 'CUP_O_RUS_Patrol_bag_Green';
for '_i' from 1 to 6 do { _this addItemToBackpack  'rhs_VG40TB';};
for '_i' from 1 to 6 do { _this addItemToBackpack  'rhs_VOG25P';};
for '_i' from 1 to 8 do { _this addItemToBackpack  'rhs_VOG25';};
for '_i' from 1 to 6 do { _this addItemToBackpack  'rhs_GDM40';};
for '_i' from 1 to 2 do { _this addItemToBackpack  'rhs_GRD40_White';};
for '_i' from 1 to 2 do { _this addItemToBackpack  'rhs_GRD40_Green';};
for '_i' from 1 to 2 do { _this addItemToBackpack  'rhs_GRD40_Red';};

_this addWeapon 'rhs_weap_ak103_gp25_npz';
_this addPrimaryWeaponItem 'rhs_acc_dtk2';
_this addPrimaryWeaponItem 'iansky_specterdr_2d';
_this addPrimaryWeaponItem 'grcb_30Rnd_762x39mm_polymer_7N23';
_this addWeapon 'rhs_weap_pya';

_this addHeadgear 'lshzbc4';
_this addGoggles 'CUP_G_RUS_Balaclava_Ratnik';

_this linkItem 'ItemMap';
_this linkItem 'ItemCompass';
_this linkItem 'tf_microdagr';
_this linkItem 'ItemRadio';
_this linkItem 'ItemGPS';
_this addWeapon '40th_binocular_6x30';

