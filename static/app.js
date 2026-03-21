const SUPPORTED_LANGUAGES = ["en", "vi"];
const LANGUAGE_STORAGE_KEY = "werewolf:lang";

const ROLE_LABELS = {
  en: {
    Doppelganger: "Doppelganger",
    Werewolf: "Werewolf",
    Minion: "Minion",
    Mason: "Mason",
    Seer: "Seer",
    Robber: "Robber",
    Troublemaker: "Troublemaker",
    Drunk: "Drunk",
    Insomniac: "Insomniac",
    Villager: "Villager",
    Hunter: "Hunter",
    Tanner: "Tanner",
  },
  vi: {
    Doppelganger: "Kẻ Sao Chép",
    Werewolf: "Ma Sói",
    Minion: "Tay Sai",
    Mason: "Hội Kín",
    Seer: "Tiên Tri",
    Robber: "Kẻ Cướp",
    Troublemaker: "Kẻ Gây Rối",
    Drunk: "Kẻ Say",
    Insomniac: "Mất Ngủ",
    Villager: "Dân Làng",
    Hunter: "Thợ Săn",
    Tanner: "Chán Đời",
  },
};

const I18N = {
  en: {
    "app.title": "One Night Werewolf",
    "app.language": "Language",
    "join.title": "Join a Room",
    "join.roomId": "Room ID",
    "join.name": "Name",
    "join.roomPlaceholder": "friends-night",
    "join.namePlaceholder": "Your name",
    "join.hint": "Max 12 players. Host configures N+3 roles for N players, then starts.",
    "button.join": "Join",
    "button.saveConfig": "Save Config",
    "button.start": "Start Game",
    "button.reset": "Reset",
    "button.send": "Send",
    "button.submit": "Submit",
    "button.submitVote": "Submit Vote",
    "status.room": "Room",
    "status.roomTitle": "Room: {roomId}",
    "status.phase": "Phase: {phase}",
    "status.wake": "Wake: {role}",
    "status.timer": "Timer: {seconds}s",
    "status.discussion": "Discussion: {seconds}s",
    "status.voteTime": "Discussion timer ended — vote time.",
    "status.revealIn": "Revealing result in: {seconds}s",
    "status.readyStart": "Ready to start.",
    "status.cannotStart": "Cannot start: {blockers}",
    "notice.waiting": "Waiting for other players...",
    "notice.needAction": "Your turn: action needed now.",
    "notice.passive": "Your role action has been completed.",
    "notice.skipped": "Your action was skipped (timer ended).",
    "notice.vote": "Vote now.",
    "notice.voteDone": "Vote submitted. Waiting for others.",
    "notice.reveal": "Round ended. Check result details.",
    "notice.lobby": "Waiting in lobby.",
    "phase.lobby": "Lobby",
    "phase.night": "Night",
    "phase.day": "Day",
    "phase.reveal": "Reveal",
    "config.title": "Role Config (Host)",
    "config.readonlyTitle": "Configured Roles",
    "config.timer": "Timer (sec)",
    "config.discussionTimer": "Discussion Timer (sec)",
    "config.summary": "Configured roles: {configured} • Required: {required}",
    "config.none": "No roles configured.",
    "section.players": "Players",
    "section.yourRole": "Your Role",
    "section.notes": "Private Notes",
    "section.action": "Action",
    "section.chat": "Chat",
    "section.result": "Result",
    "self.you": "You: {name}{hostTag}",
    "self.youDefault": "You: -",
    "self.noRoleYet": "No role assigned yet.",
    "self.originalLabel": "Original role",
    "self.original": "Original role: {role}",
    "self.finalSuffix": " • Final role: {role}",
    "tag.host": "host",
    "tag.offline": "offline",
    "player.final": "final: {role}",
    "action.none": "No action required right now.",
    "action.voteSubmitted": "Vote submitted. Waiting for others.",
    "action.prompt.doppelganger": "Choose one player to copy.",
    "action.prompt.werewolf_peek": "You are the lone werewolf. Peek one center card.",
    "action.prompt.seerCenter": "Choose one player OR two center cards.",
    "action.prompt.seerPlayer": "Choose one player to inspect.",
    "action.prompt.robber": "Choose one player to rob.",
    "action.prompt.troublemaker": "Choose two players to swap.",
    "action.prompt.drunk": "Choose one center card to swap with.",
    "action.prompt.vote": "Vote for one player to eliminate, or abstain.",
    "action.seer.player": "Inspect player",
    "action.seer.center": "Inspect center cards",
    "action.noCenter": "No center cards available for this action.",
    "select.noVote": "No vote",
    "select.noPlayers": "No players available",
    "select.noCenter": "No center cards",
    "select.center": "Center #{index}",
    "chat.placeholder": "Type a message...",
    "chat.system": "System",
    "result.none": "No result yet.",
    "result.winner": "Winner: {winner}",
    "result.eliminated": "Eliminated:",
    "result.nobody": "Nobody",
    "result.finalRoles": "Final Roles:",
    "result.votes": "Votes:",
    "result.centerCards": "Center Cards:",
    "result.actionHistory": "Action History:",
    "winner.village": "Village",
    "winner.werewolfTeam": "Werewolf Team",
    "winner.tanner": "Tanner",
    "vote.none": "No vote",
    "error.socket": "Socket is not connected.",
    "error.roomRequired": "Room ID is required.",
    "error.nameRequired": "Name is required.",
    "error.disconnected": "Disconnected from server.",
    "error.websocket": "WebSocket error.",
    "error.invalidJson": "Invalid JSON from server.",
    "error.server": "Server error.",
    "server.cannotJoinAfterStart": "Cannot join a room after the game has started. Wait for reset.",
    "server.roomFull": "Room is full. Maximum is 12 players.",
    "server.invalidPayload": "Invalid websocket message payload.",
    "server.roomNotFound": "Room not found.",
    "server.playerNotInRoom": "Player does not belong to this room.",
    "server.unknownMessageType": "Unknown message type.",
    "server.onlyHost": "Only the host can do that.",
    "server.configureOnlyLobby": "Roles can only be configured while in lobby.",
    "server.needAtLeastThree": "Need at least 3 players to start.",
    "server.roleConfigEmpty": "Role configuration is empty.",
    "server.totalRoleMismatch": "Total configured roles must equal current player count + 3.",
    "server.alreadyStarted": "Game has already started.",
    "server.exactRoleMismatch": "Configured roles must exactly match number of players + 3.",
    "server.needThreeCenter": "Exactly 3 center cards are required.",
    "server.drunkNoCenter": "No center cards configured. Drunk has no action.",
    "server.nightOnly": "Night actions are only allowed during night.",
    "server.notYourTurn": "It is not your turn to act.",
    "server.timerEnded": "This role timer has ended.",
    "server.noActiveRole": "No active night role.",
    "server.werewolfLoneOnly": "Werewolf action is only for a lone werewolf.",
    "server.noCenterConfigured": "No center cards configured.",
    "server.seerEither": "Seer action must be either player OR center cards, not both.",
    "server.seerSelf": "Seer cannot inspect themselves.",
    "server.unknownPlayerTarget": "Unknown player target.",
    "server.seerNeedPlayer": "Seer must inspect a player because no center cards are configured.",
    "server.seerNeedTwoCenter": "Seer must choose exactly two center card indices.",
    "server.seerCenterDifferent": "Seer center card choices must be different.",
    "server.troubleTwoTargets": "Troublemaker requires two player targets.",
    "server.troubleTargetsDifferent": "Troublemaker targets must be different players.",
    "server.troubleNoSelf": "Troublemaker cannot target themselves.",
    "server.troubleTargetMissing": "Troublemaker target not found.",
    "server.voteDayOnly": "Voting is only allowed during day.",
    "server.voteTargetMissing": "Vote target is not in this room.",
    "server.nameMustString": "Name must be a string.",
    "server.missingPlayerTarget": "Missing player target.",
    "server.cannotTargetSelf": "You cannot target yourself.",
    "server.targetNotFound": "Target player not found.",
    "server.noCenterAvailable": "No center cards are available.",
    "server.centerIndexInt": "Center index must be an integer.",
    "server.centerIndexRange": "Center index out of range.",
    "server.chatMustText": "Chat message must be text.",
    "server.chatTooLong": "Chat message too long.",
    "server.joinedLobby": "You joined the lobby.",
    "server.nightStarted": "Night started.",
    "server.dayStarted": "Day phase started. Vote for who to eliminate.",
    "server.noWerewolvesInPlay": "There are no werewolves in play.",
    "server.noCenterAction": "No center cards configured. Drunk has no action.",
    "server.gameResetWaiting": "Game reset. Waiting in lobby.",
    "server.simplifiedDoppel": "Simplified rule: copied role does not perform extra wake-up action.",
    "server.onlyMason": "You are the only mason.",
    "server.loneWerewolfPeek": "You are the only werewolf. You may peek one center card.",
    "server.loneWerewolfNoCenter": "You are the only werewolf. No center card is available to peek.",
    "server.roleBetween": "Role {role} must be between {min} and {max}.",
    "server.countInteger": "Count for role {role} must be an integer.",
    "server.timerRange": "timer_seconds must be between {min} and {max}.",
    "server.configSaved": "Role config saved. Total roles: {count}.",
    "server.turnStarted": "{role} turn started ({seconds}s).",
    "server.noActiveRoleHad": "No active player had role {role}.",
    "server.timerEndedSkipped": "{role} timer ended. Skipped: {names}.",
    "server.timerEndedSimple": "{role} timer ended.",
    "server.timerEndedYourSkipped": "{role} timer ended. Your action was skipped.",
    "server.allActionsSubmitted": "All actions submitted for {role}. Waiting for timer.",
    "server.votingResolved": "Voting resolved. Winner: {winner}.",
    "server.originalRole": "Original role: {role}.",
    "server.insomniacCheck": "Insomniac check: your final role is {role}.",
    "server.centerCardReveal": "Center card #{index} is {role}.",
    "server.seerSawPlayer": "Seer saw {name}: {role}.",
    "server.seerSawCenter": "Seer saw center #{firstIndex}: {firstRole}; center #{secondIndex}: {secondRole}.",
    "server.copiedRole": "You copied {name} and became {role}.",
    "server.robbedRole": "You robbed {name} and your new role is {role}.",
    "server.swappedPlayers": "You swapped {a} and {b}.",
    "server.swappedCenter": "You swapped with center card #{index}. (You do not see your new role.)",
    "server.werewolvesAre": "Werewolves are: {names}.",
    "server.otherWerewolves": "Other werewolves: {names}.",
    "server.otherMasons": "Other mason(s): {names}.",
    "server.resetBy": "{name} reset the game.",
  },
  vi: {
    "app.title": "Ma Sói Một Đêm",
    "app.language": "Ngôn ngữ",
    "join.title": "Vào phòng",
    "join.roomId": "Mã phòng",
    "join.name": "Tên",
    "join.roomPlaceholder": "ban-be-toi-nay",
    "join.namePlaceholder": "Tên của bạn",
    "join.hint": "Tối đa 12 người chơi. Chủ phòng cấu hình N+3 vai cho N người rồi bắt đầu.",
    "button.join": "Vào phòng",
    "button.saveConfig": "Lưu cấu hình",
    "button.start": "Bắt đầu",
    "button.reset": "Đặt lại",
    "button.send": "Gửi",
    "button.submit": "Xác nhận",
    "button.submitVote": "Gửi phiếu",
    "status.room": "Phòng",
    "status.roomTitle": "Phòng: {roomId}",
    "status.phase": "Giai đoạn: {phase}",
    "status.wake": "Đang gọi: {role}",
    "status.timer": "Đếm giờ: {seconds}s",
    "status.discussion": "Thảo luận: {seconds}s",
    "status.voteTime": "Hết giờ thảo luận — đến giờ bỏ phiếu.",
    "status.revealIn": "Lật kết quả sau: {seconds}s",
    "status.readyStart": "Sẵn sàng bắt đầu.",
    "status.cannotStart": "Chưa thể bắt đầu: {blockers}",
    "notice.waiting": "Đang chờ người chơi khác...",
    "notice.needAction": "Đến lượt bạn: cần hành động ngay.",
    "notice.passive": "Hành động vai của bạn đã hoàn tất.",
    "notice.skipped": "Hành động của bạn đã bị bỏ qua (hết giờ).",
    "notice.vote": "Hãy bỏ phiếu ngay.",
    "notice.voteDone": "Đã gửi phiếu. Đang chờ người khác.",
    "notice.reveal": "Ván đã kết thúc. Xem chi tiết kết quả.",
    "notice.lobby": "Đang chờ trong sảnh.",
    "phase.lobby": "Sảnh",
    "phase.night": "Đêm",
    "phase.day": "Ngày",
    "phase.reveal": "Lật vai",
    "config.title": "Cấu hình vai (Chủ phòng)",
    "config.readonlyTitle": "Vai đã cấu hình",
    "config.timer": "Thời gian (giây)",
    "config.discussionTimer": "Thời gian thảo luận (giây)",
    "config.summary": "Tổng vai: {configured} • Cần: {required}",
    "config.none": "Chưa cấu hình vai nào.",
    "section.players": "Người chơi",
    "section.yourRole": "Vai của bạn",
    "section.notes": "Ghi chú riêng",
    "section.action": "Hành động",
    "section.chat": "Chat",
    "section.result": "Kết quả",
    "self.you": "Bạn: {name}{hostTag}",
    "self.youDefault": "Bạn: -",
    "self.noRoleYet": "Chưa được chia vai.",
    "self.originalLabel": "Vai gốc",
    "self.original": "Vai gốc: {role}",
    "self.finalSuffix": " • Vai cuối: {role}",
    "tag.host": "chủ phòng",
    "tag.offline": "mất kết nối",
    "player.final": "vai cuối: {role}",
    "action.none": "Hiện tại bạn không cần hành động.",
    "action.voteSubmitted": "Đã gửi phiếu. Đang chờ người khác.",
    "action.prompt.doppelganger": "Chọn 1 người để sao chép.",
    "action.prompt.werewolf_peek": "Bạn là ma sói đơn độc. Hãy xem 1 lá giữa.",
    "action.prompt.seerCenter": "Chọn 1 người hoặc 2 lá giữa.",
    "action.prompt.seerPlayer": "Chọn 1 người để soi.",
    "action.prompt.robber": "Chọn 1 người để cướp vai.",
    "action.prompt.troublemaker": "Chọn 2 người để đổi vai.",
    "action.prompt.drunk": "Chọn 1 lá giữa để đổi.",
    "action.prompt.vote": "Bỏ phiếu loại 1 người, hoặc không bỏ phiếu.",
    "action.seer.player": "Soi người chơi",
    "action.seer.center": "Soi bài giữa",
    "action.noCenter": "Không có lá giữa cho hành động này.",
    "select.noVote": "Không bỏ phiếu",
    "select.noPlayers": "Không có người chơi khả dụng",
    "select.noCenter": "Không có lá giữa",
    "select.center": "Lá giữa #{index}",
    "chat.placeholder": "Nhập tin nhắn...",
    "chat.system": "Hệ thống",
    "result.none": "Chưa có kết quả.",
    "result.winner": "Bên thắng: {winner}",
    "result.eliminated": "Người bị loại:",
    "result.nobody": "Không ai",
    "result.finalRoles": "Vai cuối cùng:",
    "result.votes": "Phiếu bầu:",
    "result.centerCards": "Bài giữa:",
    "result.actionHistory": "Lịch sử hành động:",
    "winner.village": "Dân Làng",
    "winner.werewolfTeam": "Phe Ma Sói",
    "winner.tanner": "Chán Đời",
    "vote.none": "Không bỏ phiếu",
    "error.socket": "Socket chưa kết nối.",
    "error.roomRequired": "Cần nhập mã phòng.",
    "error.nameRequired": "Cần nhập tên.",
    "error.disconnected": "Đã ngắt kết nối máy chủ.",
    "error.websocket": "Lỗi WebSocket.",
    "error.invalidJson": "Dữ liệu JSON từ máy chủ không hợp lệ.",
    "error.server": "Lỗi máy chủ.",
    "server.cannotJoinAfterStart": "Không thể vào phòng sau khi ván đã bắt đầu. Hãy chờ đặt lại.",
    "server.roomFull": "Phòng đã đầy. Tối đa 12 người chơi.",
    "server.invalidPayload": "Dữ liệu websocket không hợp lệ.",
    "server.roomNotFound": "Không tìm thấy phòng.",
    "server.playerNotInRoom": "Người chơi không thuộc phòng này.",
    "server.unknownMessageType": "Loại tin nhắn không xác định.",
    "server.onlyHost": "Chỉ chủ phòng mới làm được thao tác này.",
    "server.configureOnlyLobby": "Chỉ được cấu hình vai khi đang ở sảnh.",
    "server.needAtLeastThree": "Cần ít nhất 3 người chơi để bắt đầu.",
    "server.roleConfigEmpty": "Cấu hình vai đang trống.",
    "server.totalRoleMismatch": "Tổng vai phải bằng số người chơi hiện tại + 3.",
    "server.alreadyStarted": "Ván chơi đã bắt đầu.",
    "server.exactRoleMismatch": "Cấu hình vai phải khớp chính xác số người chơi + 3.",
    "server.needThreeCenter": "Cần đúng 3 lá bài giữa.",
    "server.drunkNoCenter": "Không có bài giữa. Vai Kẻ Say không có hành động.",
    "server.nightOnly": "Chỉ được làm hành động ban đêm khi đang ở giai đoạn đêm.",
    "server.notYourTurn": "Chưa đến lượt bạn hành động.",
    "server.timerEnded": "Đã hết thời gian cho vai này.",
    "server.noActiveRole": "Không có vai đêm đang hoạt động.",
    "server.werewolfLoneOnly": "Hành động Ma Sói chỉ dành cho ma sói đơn độc.",
    "server.noCenterConfigured": "Chưa cấu hình bài giữa.",
    "server.seerEither": "Tiên Tri chỉ được chọn người chơi hoặc bài giữa, không được chọn cả hai.",
    "server.seerSelf": "Tiên Tri không thể soi chính mình.",
    "server.unknownPlayerTarget": "Mục tiêu người chơi không hợp lệ.",
    "server.seerNeedPlayer": "Tiên Tri phải soi người chơi vì không có bài giữa.",
    "server.seerNeedTwoCenter": "Tiên Tri phải chọn đúng hai chỉ số bài giữa.",
    "server.seerCenterDifferent": "Hai lá bài giữa của Tiên Tri phải khác nhau.",
    "server.troubleTwoTargets": "Kẻ Gây Rối cần hai mục tiêu người chơi.",
    "server.troubleTargetsDifferent": "Hai mục tiêu của Kẻ Gây Rối phải khác nhau.",
    "server.troubleNoSelf": "Kẻ Gây Rối không thể chọn chính mình.",
    "server.troubleTargetMissing": "Không tìm thấy mục tiêu của Kẻ Gây Rối.",
    "server.voteDayOnly": "Chỉ được bỏ phiếu vào ban ngày.",
    "server.voteTargetMissing": "Mục tiêu bỏ phiếu không nằm trong phòng.",
    "server.nameMustString": "Tên phải là chuỗi ký tự.",
    "server.missingPlayerTarget": "Thiếu mục tiêu người chơi.",
    "server.cannotTargetSelf": "Bạn không thể chọn chính mình.",
    "server.targetNotFound": "Không tìm thấy người chơi mục tiêu.",
    "server.noCenterAvailable": "Không có bài giữa để chọn.",
    "server.centerIndexInt": "Chỉ số bài giữa phải là số nguyên.",
    "server.centerIndexRange": "Chỉ số bài giữa vượt ngoài phạm vi.",
    "server.chatMustText": "Tin nhắn chat phải là văn bản.",
    "server.chatTooLong": "Tin nhắn chat quá dài.",
    "server.joinedLobby": "Bạn đã vào sảnh.",
    "server.nightStarted": "Đêm đã bắt đầu.",
    "server.dayStarted": "Giai đoạn ngày bắt đầu. Hãy bỏ phiếu người bị loại.",
    "server.noWerewolvesInPlay": "Không có Ma Sói trong ván này.",
    "server.noCenterAction": "Không có bài giữa. Vai Kẻ Say không có hành động.",
    "server.gameResetWaiting": "Ván đã được đặt lại. Đang chờ ở sảnh.",
    "server.simplifiedDoppel": "Luật rút gọn: vai sao chép không có hành động thức dậy bổ sung.",
    "server.onlyMason": "Bạn là Hội Kín duy nhất.",
    "server.loneWerewolfPeek": "Bạn là Ma Sói duy nhất. Bạn có thể xem 1 lá bài giữa.",
    "server.loneWerewolfNoCenter": "Bạn là Ma Sói duy nhất. Không có lá giữa để xem.",
    "server.roleBetween": "Vai {role} phải trong khoảng {min} đến {max}.",
    "server.countInteger": "Số lượng cho vai {role} phải là số nguyên.",
    "server.timerRange": "timer_seconds phải trong khoảng {min} đến {max}.",
    "server.configSaved": "Đã lưu cấu hình vai. Tổng vai: {count}.",
    "server.turnStarted": "Lượt {role} bắt đầu ({seconds}s).",
    "server.noActiveRoleHad": "Không có người chơi nào mang vai {role}.",
    "server.timerEndedSkipped": "Hết giờ {role}. Bỏ qua: {names}.",
    "server.timerEndedSimple": "Hết giờ {role}.",
    "server.timerEndedYourSkipped": "Hết giờ {role}. Hành động của bạn đã bị bỏ qua.",
    "server.allActionsSubmitted": "Đã nộp đủ hành động cho {role}. Đang chờ hết giờ.",
    "server.votingResolved": "Đã chốt bỏ phiếu. Bên thắng: {winner}.",
    "server.originalRole": "Vai gốc: {role}.",
    "server.insomniacCheck": "Mất Ngủ kiểm tra: vai cuối của bạn là {role}.",
    "server.centerCardReveal": "Lá giữa #{index} là {role}.",
    "server.seerSawPlayer": "Tiên Tri thấy {name}: {role}.",
    "server.seerSawCenter": "Tiên Tri thấy lá giữa #{firstIndex}: {firstRole}; lá giữa #{secondIndex}: {secondRole}.",
    "server.copiedRole": "Bạn sao chép {name} và trở thành {role}.",
    "server.robbedRole": "Bạn cướp {name} và vai mới của bạn là {role}.",
    "server.swappedPlayers": "Bạn đã đổi vai của {a} và {b}.",
    "server.swappedCenter": "Bạn đã đổi với lá giữa #{index}. (Bạn không nhìn thấy vai mới.)",
    "server.werewolvesAre": "Ma Sói là: {names}.",
    "server.otherWerewolves": "Ma Sói khác: {names}.",
    "server.otherMasons": "Hội Kín còn lại: {names}.",
    "server.resetBy": "{name} đã đặt lại ván.",
  },
};

const SERVER_TEXT_KEYS = {
  "Cannot join a room after the game has started. Wait for reset.": "server.cannotJoinAfterStart",
  "Room is full. Maximum is 12 players.": "server.roomFull",
  "Invalid websocket message payload.": "server.invalidPayload",
  "Room not found.": "server.roomNotFound",
  "Player does not belong to this room.": "server.playerNotInRoom",
  "Unknown message type.": "server.unknownMessageType",
  "Only the host can do that.": "server.onlyHost",
  "Roles can only be configured while in lobby.": "server.configureOnlyLobby",
  "Need at least 3 players to start.": "server.needAtLeastThree",
  "Role configuration is empty.": "server.roleConfigEmpty",
  "Total configured roles must equal current player count + 3.": "server.totalRoleMismatch",
  "Game has already started.": "server.alreadyStarted",
  "Configured roles must exactly match number of players + 3.": "server.exactRoleMismatch",
  "Exactly 3 center cards are required.": "server.needThreeCenter",
  "No center cards configured. Drunk has no action.": "server.drunkNoCenter",
  "Night actions are only allowed during night.": "server.nightOnly",
  "It is not your turn to act.": "server.notYourTurn",
  "This role timer has ended.": "server.timerEnded",
  "No active night role.": "server.noActiveRole",
  "Werewolf action is only for a lone werewolf.": "server.werewolfLoneOnly",
  "No center cards configured.": "server.noCenterConfigured",
  "Seer action must be either player OR center cards, not both.": "server.seerEither",
  "Seer cannot inspect themselves.": "server.seerSelf",
  "Unknown player target.": "server.unknownPlayerTarget",
  "Seer must inspect a player because no center cards are configured.": "server.seerNeedPlayer",
  "Seer must choose exactly two center card indices.": "server.seerNeedTwoCenter",
  "Seer center card choices must be different.": "server.seerCenterDifferent",
  "Troublemaker requires two player targets.": "server.troubleTwoTargets",
  "Troublemaker targets must be different players.": "server.troubleTargetsDifferent",
  "Troublemaker cannot target themselves.": "server.troubleNoSelf",
  "Troublemaker target not found.": "server.troubleTargetMissing",
  "Voting is only allowed during day.": "server.voteDayOnly",
  "Vote target is not in this room.": "server.voteTargetMissing",
  "Name must be a string.": "server.nameMustString",
  "Missing player target.": "server.missingPlayerTarget",
  "You cannot target yourself.": "server.cannotTargetSelf",
  "Target player not found.": "server.targetNotFound",
  "No center cards are available.": "server.noCenterAvailable",
  "Center index must be an integer.": "server.centerIndexInt",
  "Center index out of range.": "server.centerIndexRange",
  "Chat message must be text.": "server.chatMustText",
  "Chat message too long.": "server.chatTooLong",
  "You joined the lobby.": "server.joinedLobby",
  "Night started.": "server.nightStarted",
  "Day phase started. Vote for who to eliminate.": "server.dayStarted",
  "There are no werewolves in play.": "server.noWerewolvesInPlay",
  "Game reset. Waiting in lobby.": "server.gameResetWaiting",
  "Simplified rule: copied role does not perform extra wake-up action.": "server.simplifiedDoppel",
  "You are the only mason.": "server.onlyMason",
  "You are the only werewolf. You may peek one center card.": "server.loneWerewolfPeek",
  "You are the only werewolf. No center card is available to peek.": "server.loneWerewolfNoCenter",
  "No vote": "vote.none",
};

function getInitialLanguage() {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (SUPPORTED_LANGUAGES.includes(saved)) {
    return saved;
  }
  const browserLanguage = (navigator.language || "en").toLowerCase();
  return browserLanguage.startsWith("vi") ? "vi" : "en";
}

const state = {
  socket: null,
  roomId: "",
  playerName: "",
  playerId: "",
  current: null,
  language: getInitialLanguage(),
  jumpscareToken: "",
  jumpscareAudio: null,
};

const joinSection = document.getElementById("join-section");
const gameSection = document.getElementById("game-section");
const roomInput = document.getElementById("room-id");
const nameInput = document.getElementById("player-name");
const joinButton = document.getElementById("join-btn");
const saveConfigButton = document.getElementById("save-config-btn");
const startButton = document.getElementById("start-btn");
const resetButton = document.getElementById("reset-btn");
const statusTitle = document.getElementById("status-title");
const statusLine = document.getElementById("status-line");
const discussionLine = document.getElementById("discussion-line");
const stateNotice = document.getElementById("state-notice");
const startBlockers = document.getElementById("start-blockers");
const configPanel = document.getElementById("config-panel");
const configGrid = document.getElementById("config-grid");
const timerInput = document.getElementById("timer-seconds");
const discussionTimerInput = document.getElementById("discussion-timer-seconds");
const configSummary = document.getElementById("config-summary");
const configReadonly = document.getElementById("config-readonly");
const configReadonlyList = document.getElementById("config-readonly-list");
const configReadonlySummary = document.getElementById("config-readonly-summary");
const playersList = document.getElementById("players-list");
const selfName = document.getElementById("self-name");
const selfRole = document.getElementById("self-role");
const notesList = document.getElementById("notes-list");
const actionBox = document.getElementById("action-box");
const chatLog = document.getElementById("chat-log");
const chatInput = document.getElementById("chat-input");
const chatSend = document.getElementById("chat-send");
const resultBox = document.getElementById("result-box");
const errorBox = document.getElementById("error-box");
const languageSelect = document.getElementById("language-select");

roomInput.value = "friends-room";
languageSelect.value = state.language;

function formatTemplate(template, params) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, token) => {
    if (Object.prototype.hasOwnProperty.call(params, token)) {
      return String(params[token]);
    }
    return match;
  });
}

function t(key, params = {}) {
  const dictionary = I18N[state.language] || I18N.en;
  const base = dictionary[key] ?? I18N.en[key] ?? key;
  return formatTemplate(base, params);
}

function roleLabel(role) {
  const dictionary = ROLE_LABELS[state.language] || ROLE_LABELS.en;
  return dictionary[role] || role;
}

function phaseLabel(phase) {
  const key = `phase.${phase}`;
  if (I18N.en[key]) {
    return t(key);
  }
  return phase;
}

function winnerLabel(winner) {
  if (winner === "Village") {
    return t("winner.village");
  }
  if (winner === "Werewolf Team") {
    return t("winner.werewolfTeam");
  }
  if (winner === "Tanner") {
    return t("winner.tanner");
  }
  return translateServerText(winner);
}

function replaceRoleWords(message) {
  if (state.language !== "vi") {
    return message;
  }

  let text = String(message);
  text = text.replaceAll("Werewolf Team", t("winner.werewolfTeam"));
  text = text.replaceAll("Village", t("winner.village"));

  const roles = Object.keys(ROLE_LABELS.en).sort((left, right) => right.length - left.length);
  for (const role of roles) {
    const pattern = new RegExp(`\\b${role}\\b`, "g");
    text = text.replace(pattern, roleLabel(role));
  }

  return text;
}

function translateServerText(message) {
  if (typeof message !== "string" || message.length === 0) {
    return "";
  }
  if (state.language === "en") {
    return message;
  }

  const staticKey = SERVER_TEXT_KEYS[message];
  if (staticKey) {
    return t(staticKey);
  }

  let match = message.match(/^Role ([A-Za-z]+) must be between (\d+) and (\d+)\.$/);
  if (match) {
    return t("server.roleBetween", {
      role: roleLabel(match[1]),
      min: match[2],
      max: match[3],
    });
  }

  match = message.match(/^Count for role ([A-Za-z]+) must be an integer\.$/);
  if (match) {
    return t("server.countInteger", { role: roleLabel(match[1]) });
  }

  match = message.match(/^timer_seconds must be between (\d+) and (\d+)\.$/);
  if (match) {
    return t("server.timerRange", { min: match[1], max: match[2] });
  }

  match = message.match(/^Role config saved\. Total roles: (\d+)\.$/);
  if (match) {
    return t("server.configSaved", { count: match[1] });
  }

  match = message.match(/^Original role: ([A-Za-z]+)\.$/);
  if (match) {
    return t("server.originalRole", { role: roleLabel(match[1]) });
  }

  match = message.match(/^([A-Za-z]+) turn started \((\d+)s\)\.$/);
  if (match) {
    return t("server.turnStarted", { role: roleLabel(match[1]), seconds: match[2] });
  }

  match = message.match(/^No active player had role ([A-Za-z]+)\.$/);
  if (match) {
    return t("server.noActiveRoleHad", { role: roleLabel(match[1]) });
  }

  match = message.match(/^([A-Za-z]+) timer ended\. Skipped: (.+)\.$/);
  if (match) {
    return t("server.timerEndedSkipped", { role: roleLabel(match[1]), names: match[2] });
  }

  match = message.match(/^([A-Za-z]+) timer ended\. Your action was skipped\.$/);
  if (match) {
    return t("server.timerEndedYourSkipped", { role: roleLabel(match[1]) });
  }

  match = message.match(/^([A-Za-z]+) timer ended\.$/);
  if (match) {
    return t("server.timerEndedSimple", { role: roleLabel(match[1]) });
  }

  match = message.match(/^All actions submitted for ([A-Za-z]+)\. Waiting for timer\.$/);
  if (match) {
    return t("server.allActionsSubmitted", { role: roleLabel(match[1]) });
  }

  match = message.match(/^Voting resolved\. Winner: (.+)\.$/);
  if (match) {
    return t("server.votingResolved", { winner: winnerLabel(match[1]) });
  }

  match = message.match(/^Insomniac check: your final role is ([A-Za-z]+)\.$/);
  if (match) {
    return t("server.insomniacCheck", { role: roleLabel(match[1]) });
  }

  match = message.match(/^Center card #(\d+) is ([A-Za-z]+)\.$/);
  if (match) {
    return t("server.centerCardReveal", { index: match[1], role: roleLabel(match[2]) });
  }

  match = message.match(/^Seer saw (.+): ([A-Za-z]+)\.$/);
  if (match) {
    return t("server.seerSawPlayer", { name: match[1], role: roleLabel(match[2]) });
  }

  match = message.match(/^Seer saw center #(\d+): ([A-Za-z]+); center #(\d+): ([A-Za-z]+)\.$/);
  if (match) {
    return t("server.seerSawCenter", {
      firstIndex: match[1],
      firstRole: roleLabel(match[2]),
      secondIndex: match[3],
      secondRole: roleLabel(match[4]),
    });
  }

  match = message.match(/^You copied (.+) and became ([A-Za-z]+)\.$/);
  if (match) {
    return t("server.copiedRole", { name: match[1], role: roleLabel(match[2]) });
  }

  match = message.match(/^You robbed (.+) and your new role is ([A-Za-z]+)\.$/);
  if (match) {
    return t("server.robbedRole", { name: match[1], role: roleLabel(match[2]) });
  }

  match = message.match(/^You swapped (.+) and (.+)\.$/);
  if (match) {
    return t("server.swappedPlayers", { a: match[1], b: match[2] });
  }

  match = message.match(/^You swapped with center card #(\d+)\. \(You do not see your new role\.\)$/);
  if (match) {
    return t("server.swappedCenter", { index: match[1] });
  }

  match = message.match(/^Werewolves are: (.+)\.$/);
  if (match) {
    return t("server.werewolvesAre", { names: match[1] });
  }

  match = message.match(/^Other werewolves: (.+)\.$/);
  if (match) {
    return t("server.otherWerewolves", { names: match[1] });
  }

  match = message.match(/^Other mason\(s\): (.+)\.$/);
  if (match) {
    return t("server.otherMasons", { names: match[1] });
  }

  match = message.match(/^(.+) reset the game\.$/);
  if (match) {
    return t("server.resetBy", { name: match[1] });
  }

  return replaceRoleWords(message);
}

function setText(id, key, params = {}) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = t(key, params);
  }
}

function applyStaticTranslations() {
  document.documentElement.lang = state.language;
  document.title = t("app.title");

  setText("app-title", "app.title");
  setText("language-label", "app.language");
  setText("join-title", "join.title");
  setText("room-id-label", "join.roomId");
  setText("player-name-label", "join.name");
  setText("join-hint", "join.hint");
  setText("config-title", "config.title");
  setText("config-readonly-title", "config.readonlyTitle");
  setText("timer-label", "config.timer");
  setText("discussion-timer-label", "config.discussionTimer");
  setText("players-title", "section.players");
  setText("your-role-title", "section.yourRole");
  setText("notes-title", "section.notes");
  setText("action-title", "section.action");
  setText("chat-title", "section.chat");
  setText("result-title", "section.result");

  roomInput.placeholder = t("join.roomPlaceholder");
  nameInput.placeholder = t("join.namePlaceholder");
  chatInput.placeholder = t("chat.placeholder");

  joinButton.textContent = t("button.join");
  saveConfigButton.textContent = t("button.saveConfig");
  startButton.textContent = t("button.start");
  resetButton.textContent = t("button.reset");
  chatSend.textContent = t("button.send");

  if (!state.current) {
    statusTitle.textContent = t("status.room");
    selfName.textContent = t("self.youDefault");
    selfRole.textContent = t("self.noRoleYet");
    resultBox.textContent = t("result.none");
  }
}

function setLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return;
  }
  state.language = language;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  languageSelect.value = language;
  clearError();
  applyStaticTranslations();
  if (state.current) {
    renderState();
  }
}

function idStorageKey(roomId, playerName) {
  return `werewolf:${roomId}:${playerName}`;
}

function clearError() {
  errorBox.textContent = "";
}

function setError(message) {
  errorBox.textContent = message;
}

function sendMessage(payload) {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
    setError(t("error.socket"));
    return;
  }
  state.socket.send(JSON.stringify(payload));
}

function connect() {
  clearError();

  const roomId = roomInput.value.trim();
  const playerName = nameInput.value.trim();
  if (!roomId) {
    setError(t("error.roomRequired"));
    return;
  }
  if (!playerName) {
    setError(t("error.nameRequired"));
    return;
  }

  state.roomId = roomId;
  state.playerName = playerName;
  state.current = null;

  const savedId = localStorage.getItem(idStorageKey(roomId, playerName));
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  let url = `${protocol}://${location.host}/ws/${encodeURIComponent(roomId)}?name=${encodeURIComponent(playerName)}`;
  if (savedId) {
    url += `&player_id=${encodeURIComponent(savedId)}`;
  }

  if (state.socket) {
    state.socket.close();
  }

  const socket = new WebSocket(url);
  state.socket = socket;

  socket.onopen = () => {
    joinSection.classList.add("hidden");
    gameSection.classList.remove("hidden");
  };

  socket.onclose = () => {
    setError(t("error.disconnected"));
    gameSection.classList.add("hidden");
    joinSection.classList.remove("hidden");
  };

  socket.onerror = () => {
    setError(t("error.websocket"));
  };

  socket.onmessage = (event) => {
    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch (_error) {
      setError(t("error.invalidJson"));
      return;
    }

    if (payload.type === "error") {
      setError(translateServerText(payload.message || t("error.server")));
      if (!state.current) {
        gameSection.classList.add("hidden");
        joinSection.classList.remove("hidden");
      }
      return;
    }

    if (payload.type === "welcome") {
      state.playerId = payload.player_id;
      localStorage.setItem(idStorageKey(state.roomId, state.playerName), payload.player_id);
      clearError();
      return;
    }

    if (payload.type === "state") {
      state.current = payload.state;
      clearError();
      renderState();
    }
  };
}

function getRemainingSeconds(room) {
  if (!room || !room.active_role_deadline_epoch) {
    return null;
  }
  const delta = room.active_role_deadline_epoch - Date.now() / 1000;
  return Math.max(0, Math.ceil(delta));
}

function getDiscussionRemainingSeconds(room) {
  if (!room || room.phase !== "day" || !room.discussion_deadline_epoch) {
    return null;
  }
  const delta = room.discussion_deadline_epoch - Date.now() / 1000;
  return Math.max(0, Math.ceil(delta));
}

function getNoticeState(room, self) {
  const notes = Array.isArray(self.known_info) ? self.known_info : [];
  const lastNote = notes.length > 0 ? notes[notes.length - 1] : "";

  if (room.phase === "reveal") {
    return { level: "success", text: t("notice.reveal") };
  }
  if (room.phase === "lobby") {
    return { level: "secondary", text: t("notice.lobby") };
  }
  if (self.action) {
    if (self.action.kind === "vote") {
      if (self.vote_submitted) {
        return { level: "success", text: t("notice.voteDone") };
      }
      return { level: "primary", text: t("notice.vote") };
    }
    return { level: "primary", text: t("notice.needAction") };
  }
  if (/timer ended\. your action was skipped\./i.test(lastNote)) {
    return { level: "warning", text: t("notice.skipped") };
  }
  if (
    /(you copied|you robbed|you swapped|seer saw|insomniac check|werewolves are|other werewolves|other mason|you are the only mason|you are the only werewolf|there are no werewolves)/i.test(lastNote)
  ) {
    return { level: "success", text: t("notice.passive") };
  }
  return { level: "secondary", text: t("notice.waiting") };
}

function renderStateNotice(room, self) {
  const notice = getNoticeState(room, self);
  stateNotice.className = `alert alert-${notice.level} py-2 px-3`;
  stateNotice.textContent = notice.text;
}

function renderState() {
  if (!state.current) {
    return;
  }

  const room = state.current.room;
  const self = state.current.self;

  statusTitle.textContent = t("status.roomTitle", { roomId: room.id });
  renderStatusLine(room);
  renderStateNotice(room, self);
  renderStartBlockers(room, self);

  saveConfigButton.classList.toggle("hidden", !self.can_configure);
  startButton.classList.toggle("hidden", !self.is_host);
  startButton.disabled = !self.can_start;
  resetButton.classList.toggle("hidden", !self.can_reset);

  renderRoleConfig(room, self);
  renderPlayers(room);
  renderSelfState(self);
  renderAction(self.action, self.vote_submitted);
  renderChat(room.chat_log || []);
  renderResult(room.result, room.center_cards, room.action_history);
  maybeTriggerJumpscare(room, self);
}

function renderStatusLine(room) {
  const parts = [t("status.phase", { phase: phaseLabel(room.phase) })];
  if (room.turn_role) {
    parts.push(t("status.wake", { role: roleLabel(room.turn_role) }));
  }
  const seconds = getRemainingSeconds(room);
  if (seconds !== null && room.phase === "night") {
    parts.push(t("status.timer", { seconds }));
  }
  statusLine.textContent = parts.join(" • ");

  const discussionSeconds = getDiscussionRemainingSeconds(room);
  if (room.phase === "day") {
    const pendingRevealSeconds = Number(room.pending_reveal_remaining_seconds ?? 0);
    if (pendingRevealSeconds > 0) {
      discussionLine.textContent = t("status.revealIn", { seconds: pendingRevealSeconds });
      discussionLine.classList.remove("text-primary");
      discussionLine.classList.add("text-danger", "fw-bold");
    } else if (discussionSeconds !== null && discussionSeconds > 0) {
      discussionLine.textContent = t("status.discussion", { seconds: discussionSeconds });
      discussionLine.classList.remove("text-danger", "fw-bold");
      discussionLine.classList.add("text-primary");
    } else {
      discussionLine.textContent = t("status.voteTime");
      discussionLine.classList.remove("text-primary");
      discussionLine.classList.add("text-danger", "fw-bold");
    }
  } else {
    discussionLine.textContent = "";
    discussionLine.classList.remove("text-primary", "text-danger", "fw-bold");
  }
}

function renderStartBlockers(room, self) {
  if (!self.is_host || room.phase !== "lobby") {
    startBlockers.textContent = "";
    return;
  }

  if (!self.start_blockers || self.start_blockers.length === 0) {
    startBlockers.textContent = t("status.readyStart");
    return;
  }

  const blockersText = self.start_blockers.map((entry) => translateServerText(entry)).join(" | ");
  startBlockers.textContent = t("status.cannotStart", { blockers: blockersText });
}

function renderRoleConfig(room, self) {
  const showHostEditor = self.can_configure;
  configPanel.classList.toggle("hidden", !showHostEditor);
  configReadonly.classList.toggle("hidden", showHostEditor);

  configGrid.innerHTML = "";

  const constraints = room.role_constraints || {};
  const configuredRoles = room.configured_roles || {};
  const roleNames = Object.keys(constraints);

  for (const role of roleNames) {
    const limits = constraints[role];

    const label = document.createElement("div");
    label.className = "config-label";
    label.textContent = `${roleLabel(role)} (${limits.min}-${limits.max})`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = String(limits.min);
    input.max = String(limits.max);
    input.step = "1";
    input.dataset.role = role;
    input.className = "count-input";
    input.value = String(configuredRoles[role] ?? 0);

    const decreaseButton = createButton("-", () => {
      adjustRoleCount(input, -1, limits.min, limits.max);
    });
    decreaseButton.classList.add("tiny-btn");

    const increaseButton = createButton("+", () => {
      adjustRoleCount(input, 1, limits.min, limits.max);
    });
    increaseButton.classList.add("tiny-btn");

    const controls = document.createElement("div");
    controls.className = "config-controls";
    controls.appendChild(decreaseButton);
    controls.appendChild(input);
    controls.appendChild(increaseButton);

    configGrid.appendChild(label);
    configGrid.appendChild(controls);
  }

  timerInput.value = String(room.role_timer_seconds ?? 12);
  discussionTimerInput.value = String(room.discussion_timer_seconds ?? 90);

  const summary = t("config.summary", {
    configured: room.configured_role_total,
    required: room.player_count + 3,
  });
  configSummary.textContent = summary;
  configReadonlySummary.textContent = summary;

  configReadonlyList.innerHTML = "";
  const configuredEntries = Object.entries(configuredRoles)
    .filter(([, count]) => Number(count) > 0)
    .sort((left, right) => left[0].localeCompare(right[0]));

  if (configuredEntries.length === 0) {
    const item = document.createElement("li");
    item.textContent = t("config.none");
    configReadonlyList.appendChild(item);
  } else {
    for (const [role, count] of configuredEntries) {
      const item = document.createElement("li");
      item.textContent = `${roleLabel(role)}: ${count}`;
      configReadonlyList.appendChild(item);
    }
  }
}

function renderPlayers(room) {
  playersList.innerHTML = "";
  for (const player of room.players) {
    const item = document.createElement("li");
    const tags = [];

    if (player.is_host) {
      tags.push(t("tag.host"));
    }
    if (!player.connected) {
      tags.push(t("tag.offline"));
    }

    let text = player.name;
    if (tags.length) {
      text += ` (${tags.join(", ")})`;
    }

    if (room.phase === "reveal" && player.final_role) {
      text += ` • ${t("player.final", { role: roleLabel(player.final_role) })}`;
    }

    item.textContent = text;
    playersList.appendChild(item);
  }
}

function renderSelfState(self) {
  const hostTag = self.is_host ? ` (${t("tag.host")})` : "";
  selfName.textContent = t("self.you", { name: self.name, hostTag });
  selfName.classList.add("self-name");

  if (self.original_role) {
    selfRole.classList.remove("text-muted");
    selfRole.classList.add("alert", "alert-primary", "py-2", "px-3", "mb-2");
    selfRole.textContent = "";

    const originalBadge = document.createElement("span");
    originalBadge.className = "badge text-bg-primary me-2";
    originalBadge.textContent = t("self.originalLabel");

    const originalText = document.createElement("span");
    originalText.textContent = roleLabel(self.original_role);

    selfRole.appendChild(originalBadge);
    selfRole.appendChild(originalText);

    if (self.final_role) {
      const finalText = document.createElement("span");
      finalText.textContent = t("self.finalSuffix", { role: roleLabel(self.final_role) });
      selfRole.appendChild(finalText);
    }
  } else {
    selfRole.classList.remove("alert", "alert-primary", "py-2", "px-3", "mb-2");
    selfRole.classList.add("text-muted");
    selfRole.textContent = t("self.noRoleYet");
  }

  notesList.innerHTML = "";
  for (const note of self.known_info || []) {
    const item = document.createElement("li");
    item.textContent = translateServerText(note);
    notesList.appendChild(item);
  }
}

function localizedActionPrompt(action) {
  if (!action || !action.kind) {
    return "";
  }

  if (action.kind === "doppelganger") {
    return t("action.prompt.doppelganger");
  }
  if (action.kind === "werewolf_peek") {
    return t("action.prompt.werewolf_peek");
  }
  if (action.kind === "seer") {
    const hasCenter = Array.isArray(action.center_indices) && action.center_indices.length >= 2;
    return hasCenter ? t("action.prompt.seerCenter") : t("action.prompt.seerPlayer");
  }
  if (action.kind === "robber") {
    return t("action.prompt.robber");
  }
  if (action.kind === "troublemaker") {
    return t("action.prompt.troublemaker");
  }
  if (action.kind === "drunk") {
    return t("action.prompt.drunk");
  }
  if (action.kind === "vote") {
    return t("action.prompt.vote");
  }

  return translateServerText(action.prompt || "");
}

function renderAction(action, voteSubmitted) {
  actionBox.innerHTML = "";

  if (!action) {
    const text = document.createElement("p");
    text.textContent = t("action.none");
    actionBox.appendChild(text);
    return;
  }

  if (action.kind === "vote" && voteSubmitted) {
    const text = document.createElement("p");
    text.textContent = t("action.voteSubmitted");
    actionBox.appendChild(text);
    return;
  }

  const prompt = document.createElement("p");
  prompt.textContent = localizedActionPrompt(action);
  actionBox.appendChild(prompt);

  if (action.kind === "doppelganger" || action.kind === "robber") {
    const select = createPlayerSelect(action.players);
    const button = createButton(t("button.submit"), () => {
      sendMessage({ type: "night_action", target_player_id: select.value });
    });
    actionBox.appendChild(select);
    actionBox.appendChild(button);
    return;
  }

  if (action.kind === "werewolf_peek" || action.kind === "drunk") {
    if (!Array.isArray(action.center_indices) || action.center_indices.length === 0) {
      const text = document.createElement("p");
      text.textContent = t("action.noCenter");
      actionBox.appendChild(text);
      return;
    }

    const select = createCenterSelect(action.center_indices);
    const button = createButton(t("button.submit"), () => {
      sendMessage({ type: "night_action", center_index: Number(select.value) });
    });
    actionBox.appendChild(select);
    actionBox.appendChild(button);
    return;
  }

  if (action.kind === "seer") {
    const hasCenterChoice = Array.isArray(action.center_indices) && action.center_indices.length >= 2;
    const playerSelect = createPlayerSelect(action.players);

    if (!hasCenterChoice) {
      const button = createButton(t("button.submit"), () => {
        sendMessage({ type: "night_action", target_player_id: playerSelect.value });
      });
      actionBox.appendChild(playerSelect);
      actionBox.appendChild(button);
      return;
    }

    const modeRow = document.createElement("div");
    modeRow.className = "row";

    const playerRadio = document.createElement("input");
    playerRadio.type = "radio";
    playerRadio.name = "seer-mode";
    playerRadio.value = "player";
    playerRadio.checked = true;

    const centerRadio = document.createElement("input");
    centerRadio.type = "radio";
    centerRadio.name = "seer-mode";
    centerRadio.value = "center";

    const playerLabel = document.createElement("label");
    playerLabel.textContent = t("action.seer.player");
    playerLabel.prepend(playerRadio);

    const centerLabel = document.createElement("label");
    centerLabel.textContent = t("action.seer.center");
    centerLabel.prepend(centerRadio);

    modeRow.appendChild(playerLabel);
    modeRow.appendChild(centerLabel);
    actionBox.appendChild(modeRow);

    const centerOne = createCenterSelect(action.center_indices);
    const centerTwo = createCenterSelect(action.center_indices);

    const centerRow = document.createElement("div");
    centerRow.className = "row hidden";
    centerRow.appendChild(centerOne);
    centerRow.appendChild(centerTwo);

    function updateSeerInputs() {
      if (playerRadio.checked) {
        playerSelect.classList.remove("hidden");
        centerRow.classList.add("hidden");
      } else {
        playerSelect.classList.add("hidden");
        centerRow.classList.remove("hidden");
      }
    }

    playerRadio.addEventListener("change", updateSeerInputs);
    centerRadio.addEventListener("change", updateSeerInputs);

    const button = createButton(t("button.submit"), () => {
      if (playerRadio.checked) {
        sendMessage({ type: "night_action", target_player_id: playerSelect.value });
      } else {
        sendMessage({
          type: "night_action",
          center_indices: [Number(centerOne.value), Number(centerTwo.value)],
        });
      }
    });

    actionBox.appendChild(playerSelect);
    actionBox.appendChild(centerRow);
    actionBox.appendChild(button);
    return;
  }

  if (action.kind === "troublemaker") {
    const selectA = createPlayerSelect(action.players);
    const selectB = createPlayerSelect(action.players);
    const row = document.createElement("div");
    row.className = "row";
    row.appendChild(selectA);
    row.appendChild(selectB);

    const button = createButton(t("button.submit"), () => {
      sendMessage({
        type: "night_action",
        target_a: selectA.value,
        target_b: selectB.value,
      });
    });

    actionBox.appendChild(row);
    actionBox.appendChild(button);
    return;
  }

  if (action.kind === "vote") {
    const select = document.createElement("select");

    const abstain = document.createElement("option");
    abstain.value = "";
    abstain.textContent = t("select.noVote");
    select.appendChild(abstain);

    for (const player of action.players) {
      const option = document.createElement("option");
      option.value = player.id;
      option.textContent = player.name;
      select.appendChild(option);
    }

    const button = createButton(t("button.submitVote"), () => {
      sendMessage({ type: "vote", target_player_id: select.value || null });
    });

    actionBox.appendChild(select);
    actionBox.appendChild(button);
  }
}

function createPlayerSelect(players) {
  const select = document.createElement("select");
  if (!Array.isArray(players) || players.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = t("select.noPlayers");
    select.appendChild(option);
    select.disabled = true;
    return select;
  }

  for (const player of players) {
    const option = document.createElement("option");
    option.value = player.id;
    option.textContent = player.name;
    select.appendChild(option);
  }
  return select;
}

function createCenterSelect(indices) {
  const select = document.createElement("select");
  if (!Array.isArray(indices) || indices.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = t("select.noCenter");
    select.appendChild(option);
    select.disabled = true;
    return select;
  }

  for (const index of indices) {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = t("select.center", { index: index + 1 });
    select.appendChild(option);
  }
  return select;
}

function createButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function adjustRoleCount(input, delta, min, max) {
  const currentValue = Number(input.value || 0);
  const next = Math.max(min, Math.min(max, currentValue + delta));
  input.value = String(next);
}

function renderChat(chatItems) {
  chatLog.innerHTML = "";
  for (const entry of chatItems) {
    const item = document.createElement("div");
    item.className = "chat-item";

    const from = entry.from === "System" ? t("chat.system") : entry.from;
    const message = entry.from === "System" ? translateServerText(entry.message) : entry.message;

    item.textContent = `${from}: ${message}`;
    chatLog.appendChild(item);
  }
  chatLog.scrollTop = chatLog.scrollHeight;
}

function displayVote(vote) {
  if (!vote || vote === "No vote") {
    return t("vote.none");
  }
  return vote;
}

function renderResult(result, centerCards, actionHistory) {
  if (!result) {
    resultBox.textContent = t("result.none");
    return;
  }

  const lines = [];
  lines.push(t("result.winner", { winner: winnerLabel(result.winner) }));
  lines.push("");
  lines.push(t("result.eliminated"));

  if (!Array.isArray(result.eliminated) || result.eliminated.length === 0) {
    lines.push(`- ${t("result.nobody")}`);
  } else {
    for (const player of result.eliminated) {
      lines.push(`- ${player}`);
    }
  }

  lines.push("");
  lines.push(t("result.finalRoles"));
  for (const [player, role] of Object.entries(result.final_roles || {})) {
    lines.push(`- ${player}: ${roleLabel(role)}`);
  }

  lines.push("");
  lines.push(t("result.votes"));
  for (const [voter, vote] of Object.entries(result.votes || {})) {
    lines.push(`- ${voter} -> ${displayVote(vote)}`);
  }

  if (Array.isArray(centerCards) && centerCards.length > 0) {
    lines.push("");
    lines.push(t("result.centerCards"));
    centerCards.forEach((role, index) => {
      lines.push(`- #${index + 1}: ${roleLabel(role)}`);
    });
  }

  const history = Array.isArray(actionHistory)
    ? actionHistory
    : Array.isArray(result.action_history)
      ? result.action_history
      : [];
  if (history.length > 0) {
    lines.push("");
    lines.push(t("result.actionHistory"));
    history.forEach((entry) => {
      lines.push(`- ${translateServerText(entry)}`);
    });
  }

  resultBox.textContent = lines.join("\n");
}

function ensureJumpscareOverlay() {
  let overlay = document.getElementById("jumpscare-overlay");
  if (overlay) {
    return overlay;
  }

  overlay = document.createElement("div");
  overlay.id = "jumpscare-overlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "9999";
  overlay.style.background = "rgba(0, 0, 0, 0.95)";
  overlay.style.display = "none";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";

  const image = document.createElement("img");
  image.src = "/assets/werewolf-jumpscare-1.png";
  image.alt = "Werewolf jumpscare";
  image.style.maxWidth = "96vw";
  image.style.maxHeight = "96vh";
  image.style.objectFit = "contain";

  overlay.appendChild(image);
  overlay.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  document.body.appendChild(overlay);
  return overlay;
}

function maybeTriggerJumpscare(room, self) {
  if (!room || room.phase !== "reveal" || !room.result) {
    return;
  }

  if (room.result.winner !== "Werewolf Team") {
    return;
  }

  if (!self || self.final_role === "Werewolf") {
    return;
  }

  const token = `${room.id}:${self.id}:${room.result.winner}:${Object.keys(room.result.votes || {}).length}`;
  if (state.jumpscareToken === token) {
    return;
  }
  state.jumpscareToken = token;

  const overlay = ensureJumpscareOverlay();
  overlay.style.display = "flex";

  if (!state.jumpscareAudio) {
    state.jumpscareAudio = new Audio("/assets/werewolf-jumpscare-1.mp3");
    state.jumpscareAudio.preload = "auto";
  }

  state.jumpscareAudio.currentTime = 0;
  state.jumpscareAudio.volume = 1;
  state.jumpscareAudio.play().catch(() => {});

  window.setTimeout(() => {
    overlay.style.display = "none";
  }, 4500);
}

joinButton.addEventListener("click", connect);

saveConfigButton.addEventListener("click", () => {
  const roleInputs = configGrid.querySelectorAll("input[data-role]");
  const roles = {};

  for (const input of roleInputs) {
    const role = input.dataset.role;
    roles[role] = Number(input.value || 0);
  }

  sendMessage({
    type: "configure_roles",
    roles,
    timer_seconds: Number(timerInput.value || 0),
    discussion_timer_seconds: Number(discussionTimerInput.value || 0),
  });
});

startButton.addEventListener("click", () => {
  sendMessage({ type: "start_game" });
});

resetButton.addEventListener("click", () => {
  sendMessage({ type: "reset_game" });
});

chatSend.addEventListener("click", () => {
  const message = chatInput.value.trim();
  if (!message) {
    return;
  }
  sendMessage({ type: "chat", message });
  chatInput.value = "";
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    chatSend.click();
  }
});

languageSelect.addEventListener("change", () => {
  setLanguage(languageSelect.value);
});

setInterval(() => {
  if (state.current) {
    renderStatusLine(state.current.room);
  }
}, 500);

applyStaticTranslations();
