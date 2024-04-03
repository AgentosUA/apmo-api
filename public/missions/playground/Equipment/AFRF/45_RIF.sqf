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
_this addVest 'CUP_Vest_RUS_6B45_Sh117_Green';
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rgd5';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rgn';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rdg2_white';};
for '_i' from 1 to 2 do { _this addItemToVest 'wog_mag_rdgm_white';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_9x19_17';};
for '_i' from 1 to 4 do { _this addItemToVest 'grcb_30Rnd_762x39mm_polymer_7N23';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_30Rnd_762x39mm_polymer_tracer';};
_this addBackpack 'CUP_O_RUS_Patrol_bag_Green';

_this addWeapon 'rhs_weap_ak103_zenitco01_b33';
_this addPrimaryWeaponItem 'rhs_acc_dtk2';
_this addPrimaryWeaponItem 'rhs_acc_1p87';
_this addPrimaryWeaponItem 'rhs_acc_grip_ffg2';
_this addPrimaryWeaponItem 'grcb_30Rnd_762x39mm_polymer_7N23';
_this addWeapon 'rhs_weap_pya';

_this addHeadgear 'lshzbc4';
_this addGoggles 'CUP_G_RUS_Balaclava_Ratnik';

_this linkItem 'ItemMap';
_this linkItem 'ItemCompass';
_this linkItem 'tf_microdagr';
_this linkItem 'ItemRadio';
_this linkItem 'ItemGPS';


