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
_this addItemToVest 'ACE_RangeCard';
_this addItemToVest 'ACE_Kestrel4500';
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rgd5';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rgn';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rdg2_white';};
for '_i' from 1 to 2 do { _this addItemToVest 'wog_mag_rdgm_white';};
for '_i' from 1 to 3 do { _this addItemToVest 'rhs_mag_9x19_17';};
for '_i' from 1 to 22 do { _this addItemToVest 'rhs_5Rnd_338lapua_t5000';};
_this addBackpack 'CUP_O_RUS_Patrol_bag_Green';
_this addWeapon 'rhs_weap_t5000';
_this addPrimaryWeaponItem 'rhs_acc_dh520x56';
_this addPrimaryWeaponItem 'rhs_acc_harris_swivel';
_this addWeapon 'rhs_weap_pya';
_this addHeadgear 'lshzbc4';
_this addGoggles 'CUP_G_RUS_Balaclava_Ratnik';

_this linkItem 'ItemMap';
_this linkItem 'ItemCompass';
_this linkItem 'tf_microdagr';
_this linkItem 'ItemRadio';
_this linkItem 'ItemGPS';
_this addWeapon 'rhs_pdu4';

