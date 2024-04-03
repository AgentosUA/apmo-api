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
for '_i' from 1 to 2 do { _this addItemToUniform 'rhs_mag_rdg2_white';};
_this addVest 'rhs_6b45_mg';
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rgd5';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rgn';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rdg2_white';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_100Rnd_762x54mmR_7N13';};
_this addBackpack 'CUP_O_RUS_Patrol_bag_Summer';
_this addItemToBackpack  'rhs_100Rnd_762x54mmR_7N13';
_this addItemToBackpack  'rhs_100Rnd_762x54mmR_7N26';
for '_i' from 1 to 2 do { _this addItemToBackpack  'rhs_100Rnd_762x54mmR_green';};

_this addWeapon 'rhs_weap_pkp';
_this addPrimaryWeaponItem 'rhs_acc_1p29';
_this addPrimaryWeaponItem 'rhs_100Rnd_762x54mmR_7N13';

_this addHeadgear 'rhs_6b47_bala';

_this linkItem 'ItemMap';
_this linkItem 'ItemCompass';
_this linkItem 'ItemRadio';
_this linkItem 'tf_microdagr';

