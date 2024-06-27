//=============================================================================
// 戦闘画面ウィンドウ情報変更プラグイン
// EXC_OneHandSkill.js
// ----------------------------------------------------------------------------
// Copyright (c) 2024 IdiotException
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 1.0.0 2024-06-27
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 二刀流時に片手の武器のみを参照してスキルを使用できます
 * @author IdiotException
 * @url https://github.com/IdiotException/EXC_OneHandSkill
 * @help 二刀流時に片手の武器のみを参照してスキルを使用できます
 * 
 * 対象のスキルに以下のようにメモに指定することで
 * 右手のみ、左手のみといずれかのみの武器を参照するスキルになります
 * <EXC_OneHand:Right>
 * <EXC_OneHand:Left>
 * 
 * 内部処理としては、スキル発動直前に反対の手の武器を外しています。
 * そのため、特定武器等を必要とするスキルなどでも
 * 「スキル処理時には装備されていない」という状況が起こりえる点は注意が必要です。
 * 
 * 利用規約
 *   MITライセンスです。
 *   作者に無断で改変、再配布が可能で、
 *   利用形態（商用、18禁利用等）についても制限はありません。
 * 
 * @param RightHandSlot
 * @text 右手スロット
 * @desc 二刀流時に右手武器が
 * 何番目のスロットか指定します
 * @type number
 * @default 1
 * 
 * @param LeftHandSlot
 * @text 左手スロット
 * @desc 二刀流時に左手武器が
 * 何番目のスロットか指定します
 * @type number
 * @default 2
 */
const EXCOneHandSkill = document.currentScript.src.match(/^.*\/(.+)\.js$/)[1];

(function() {
	"use strict";
	//--------------------------------------------------
	// 定数設定
	//--------------------------------------------------
	// タグ関連の定数設定
	const ONE_HAND_TAG		= "EXC_OneHand";
	const RIGHT_SET			= "Right";
	const LEFT_SET			= "Left";


	//パラメータ受取処理
	const parameters = PluginManager.parameters(EXCOneHandSkill);
	const _rightSlot	= Number(parameters['RightHandSlot'] || 1);
	const _leftSlot		= Number(parameters['LeftHandSlot'] || 2);

	//--------------------------------------------------
	// 変数宣言
	//--------------------------------------------------
	let removeSlot = -1;	// 外す武器スロット番号
	let equipedId = -1;		// 外した武器のIDを保持、スキル使用後に再装備

	//--------------------------------------------------
	// Window_BattleLog のオーバーライド
	//--------------------------------------------------
	// 左手のみの場合アニメーションを反転
	const _EXC_Window_BattleLog_showActorAttackAnimation = Window_BattleLog.prototype.showActorAttackAnimation;
	Window_BattleLog.prototype.showActorAttackAnimation = function(subject, targets) {
		// 右手装備を外している場合（左手装備のみ参照）
		if(removeSlot == _rightSlot){
			this.showNormalAnimation(targets, subject.attackAnimationId1(), true);	//反転してアニメーション表示
		} else {
			// 通常処理
			_EXC_Window_BattleLog_showActorAttackAnimation.call(this, ...arguments);
		}
	};

	// スキル使用前に装備を退避して外す
	const _EXC_Window_BattleLog_startAction = Window_BattleLog.prototype.startAction;
	Window_BattleLog.prototype.startAction = function(subject, action, targets) {
		
		// アクターかつ二刀流の場合に片手外し処理
		if(subject.constructor.name == "Game_Actor" && subject.isDualWield()){
			// すでに外した装備がある場合は再装備
			if(equipedId >= 0){
				subject.changeEquipById(removeSlot,equipedId);
				// リセット
				equipedId = -1;
				removeSlot = -1;
			}

			// スキルにタグが設定されている場合処理
			const tempTag = $dataSkills[action._item._itemId].meta[ONE_HAND_TAG];
			if(tempTag){
				removeSlot = -1;
				// 外す対象の設定
				if(tempTag == RIGHT_SET){
					removeSlot = _leftSlot;
				}else if(tempTag == LEFT_SET){
					removeSlot = _rightSlot;
				}
				
				// タグ指定に誤りがなく、外す対象が装備されている場合外す処理
				// 装備スロット番号と装備のインデックスはずれるので注意
				if(removeSlot > 0 && subject.equips()[removeSlot - 1] != null){
					equipedId = subject.equips()[removeSlot - 1].id;
					subject.changeEquip(removeSlot - 1, null);
				}
			}

		}
		// 以降は元処理に戻る
		_EXC_Window_BattleLog_startAction.call(this,...arguments);

	}

	// スキル使用処理後に再装備
	const _EXC_Window_BattleLog_endAction = Window_BattleLog.prototype.endAction;
	Window_BattleLog.prototype.endAction = function(subject) {
		_EXC_Window_BattleLog_endAction.call(this,...arguments);
		// 処理後に外している装備があれば再装備
		if(equipedId >= 0){
			subject.changeEquipById(removeSlot, equipedId);
			// リセット
			equipedId = -1;
			removeSlot = -1;
		}
	};

})();

