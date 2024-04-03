if (not local _this) exitwith {};

removeAllWeapons _this;
removeAllItems _this;
removeAllAssignedItems _this;
removeUniform _this;
removeVest _this;
removeBackpack _this;
removeHeadgear _this;
removeGoggles _this;

_this forceAddUniform 'rhs_uniform_df15_tan';
_this addItemToUniform 'ACE_EarPlugs';
_this addItemToUniform 'ACE_MapTools';
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rdg2_white';};
_this addVest 'rhs_vydra_3m';
for '_i' from 1 to 3 do { _this addItemToVest 'rhs_mag_9x19mm_7n31_44';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rgd5';};
_this addBackpack 'CUP_O_RUS_Patrol_bag_Summer';
_this addWeapon 'rhs_weap_pp2000_folded';
_this addHeadgear 'rhs_zsh7a_mike_green_alt';

_this linkItem 'ItemMap';
_this linkItem 'ItemCompass';
_this linkItem 'tf_microdagr';
_this linkItem 'ItemRadio';
_this linkItem 'ItemGPS';
