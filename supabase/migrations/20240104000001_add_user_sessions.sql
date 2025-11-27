-- 创建用户会话表
-- 用于管理 Web3 地址的登录会话，提供安全性和会话管理功能

-- 用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL UNIQUE,
  user_address VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb -- 存储额外的会话信息，如 IP、User-Agent 等
);

-- 创建索引以便快速查询
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_address ON user_sessions(user_address);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- 创建复合索引用于查询活跃会话
CREATE INDEX IF NOT EXISTS idx_user_sessions_active_user 
ON user_sessions(user_address, is_active) 
WHERE is_active = true;

-- 添加注释说明
COMMENT ON TABLE user_sessions IS '用户会话表，用于管理 Web3 地址的登录会话';
COMMENT ON COLUMN user_sessions.session_id IS '会话唯一标识符，用于验证用户身份';
COMMENT ON COLUMN user_sessions.user_address IS '用户 Web3 地址';
COMMENT ON COLUMN user_sessions.expires_at IS '会话过期时间，过期后需要重新登录';
COMMENT ON COLUMN user_sessions.last_accessed_at IS '最后访问时间，用于更新会话活跃度';
COMMENT ON COLUMN user_sessions.is_active IS '会话是否活跃，false 表示已失效';
COMMENT ON COLUMN user_sessions.metadata IS '会话元数据，可存储 IP、User-Agent 等信息';

-- 创建函数：自动清理过期会话
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- 将过期会话标记为非活跃
  UPDATE user_sessions
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
  
  -- 删除超过 7 天的非活跃会话（可选，根据需求调整）
  DELETE FROM user_sessions
  WHERE is_active = false AND last_accessed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 创建函数：更新会话最后访问时间
CREATE OR REPLACE FUNCTION update_session_access(session_id_param VARCHAR(255))
RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET last_accessed_at = NOW()
  WHERE session_id = session_id_param AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 添加注释
COMMENT ON FUNCTION cleanup_expired_sessions() IS '清理过期会话，将过期会话标记为非活跃，并删除超过 7 天的非活跃会话';
COMMENT ON FUNCTION update_session_access(VARCHAR) IS '更新会话的最后访问时间';

