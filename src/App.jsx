import React, { useState, useEffect, useRef } from 'react';
import wordsData from './data/words.json';
import useQuizLogic from './useQuizLogic';

function App() {
  const [showWrongWords, setShowWrongWords] = useState(false);
  const [showUnfamiliarWords, setShowUnfamiliarWords] = useState(false);
  const [showQueues, setShowQueues] = useState(false);
  const [showPlanPage, setShowPlanPage] = useState(true);
  const [dailyPlan, setDailyPlan] = useState(5);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isDailyGoalCompleted, setIsDailyGoalCompleted] = useState(false);
  const [completionTime, setCompletionTime] = useState(null);
  const [showShareButton, setShowShareButton] = useState(false);
  const shareRef = useRef(null);

  // 使用自定义 Hook 管理答题逻辑
  const {
    currentWord,
    options,
    answered,
    selectedOption,
    correctCount,
    wrongCount,
    isCompleted,
    handleAnswer,
    initialize,
    mainQueue,
    reviewQueue,
    retryBuffer,
    wrongWords,
    unfamiliarWords
  } = useQuizLogic(wordsData);

  // 检查是否完成每日目标
  const checkDailyGoalCompletion = () => {
    if (completedToday >= dailyPlan && wrongWords.length === 0 && !isDailyGoalCompleted) {
      setIsDailyGoalCompleted(true);
      // 记录完成时间
      const now = new Date();
      setCompletionTime(now);
      // 显示分享按钮
      setShowShareButton(true);
    }
  };

  // 监听状态变化，检查是否完成每日目标
  useEffect(() => {
    checkDailyGoalCompletion();
  }, [completedToday, wrongWords, dailyPlan, isDailyGoalCompleted, checkDailyGoalCompletion]);

  // 处理答题，添加积分和进度计算
  const handleAnswerWithPoints = (option) => {
    handleAnswer(option);
    
    // 计算积分和进度
    if (option === currentWord.meaning) {
      // 答对加分
      const pointsEarned = isDailyGoalCompleted ? 15 : 10; // 完成目标后额外加分
      setTotalPoints(prev => prev + pointsEarned);
      
      // 更新今日完成进度
      if (completedToday < dailyPlan) {
        const newCompleted = completedToday + 1;
        setCompletedToday(newCompleted);
      } else {
        // 超额完成，继续更新进度
        setCompletedToday(prev => prev + 1);
      }
      
      // 检查是否完成每日目标
      setTimeout(() => {
        checkDailyGoalCompletion();
      }, 100);
    }
  };

  // 开始学习
  const startLearning = () => {
    setShowPlanPage(false);
    setCompletedToday(0);
    setIsDailyGoalCompleted(false);
    setTotalPoints(0);
    initialize();
  };

  // 重置学习
  const handleReset = () => {
    initialize();
    setCompletedToday(0);
    setTotalPoints(0);
    setIsDailyGoalCompleted(false);
    setCompletionTime(null);
    setShowShareButton(false);
  };

  // 生成分享图片
  const generateShareImage = () => {
    // 创建 canvas 元素
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // 绘制背景
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制边框
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // 绘制标题
    ctx.fillStyle = '#000';
    ctx.font = 'bold 24px SimHei, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('王舒龙的学习成果', canvas.width / 2, 60);

    // 绘制完成时间
    ctx.fillStyle = '#333';
    ctx.font = '16px SimHei, sans-serif';
    ctx.fillText(`完成时间: ${completionTime.toLocaleString()}`, canvas.width / 2, 120);

    // 绘制学习数据
    ctx.fillText(`学习单词数: ${completedToday} 个`, canvas.width / 2, 160);
    ctx.fillText(`今日计划: ${dailyPlan} 个`, canvas.width / 2, 200);
    ctx.fillText(`获得积分: ${totalPoints} 分`, canvas.width / 2, 240);

    // 绘制鼓励文字
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 20px SimHei, sans-serif';
    ctx.fillText('🎉 今日学习任务已完成！', canvas.width / 2, 320);
    ctx.font = '16px SimHei, sans-serif';
    ctx.fillText('继续保持，加油！', canvas.width / 2, 360);

    // 转换为图片 URL
    return canvas.toDataURL('image/png');
  };

  // 分享学习成果
  const shareLearningResult = () => {
    try {
      const imageUrl = generateShareImage();
      
      // 创建临时图片元素
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        // 创建下载链接
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `王舒龙学习成果_${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
      };
    } catch (error) {
      console.error('分享失败:', error);
      alert('分享失败，请稍后再试');
    }
  };

  // 获取选项样式
  const getOptionStyle = (option) => {
    if (!answered) {
      return {
        display: 'block',
        margin: '10px auto',
        width: '200px',
        padding: '15px',
        fontSize: '18px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        backgroundColor: '#fff',
        cursor: 'pointer',
        textAlign: 'center'
      };
    }
    
    if (option === currentWord.meaning) {
      return {
        display: 'block',
        margin: '10px auto',
        width: '200px',
        padding: '15px',
        fontSize: '18px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        backgroundColor: '#4CAF50',
        color: '#fff',
        cursor: 'pointer',
        textAlign: 'center'
      };
    } else if (option === selectedOption) {
      return {
        display: 'block',
        margin: '10px auto',
        width: '200px',
        padding: '15px',
        fontSize: '18px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        backgroundColor: '#FFCDD2',
        cursor: 'pointer',
        textAlign: 'center'
      };
    } else {
      return {
        display: 'block',
        margin: '10px auto',
        width: '200px',
        padding: '15px',
        fontSize: '18px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        backgroundColor: '#fff',
        cursor: 'pointer',
        textAlign: 'center',
        opacity: '0.7'
      };
    }
  };

  return (
    <div className="app">
      {showPlanPage ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h1 style={{ fontFamily: 'SimHei, sans-serif', color: '#000', fontWeight: 'bold' }}>王舒龙该记单词了！</h1>
          <img 
            src="/1770535425292_d.jpg" 
            alt="提示图片" 
            style={{ width: '200px', height: '200px', margin: '20px 0', borderRadius: '10px' }} 
          />
          <h2>今日学习计划</h2>
          <p style={{ margin: '20px 0' }}>请选择今日要学习的单词数量：</p>
          <div style={{ margin: '20px 0' }}>
            {[5, 10, 15, 20].map((number) => (
              <button
                key={number}
                style={{
                  margin: '0 10px',
                  padding: '15px 30px',
                  fontSize: '18px',
                  borderRadius: '8px',
                  border: dailyPlan === number ? '2px solid #4CAF50' : '1px solid #ddd',
                  backgroundColor: dailyPlan === number ? '#4CAF50' : '#fff',
                  color: dailyPlan === number ? '#fff' : '#333',
                  cursor: 'pointer'
                }}
                onClick={() => setDailyPlan(number)}
              >
                {number} 个
              </button>
            ))}
          </div>
          <button
            style={{
              margin: '30px 0',
              padding: '15px 40px',
              fontSize: '20px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#4CAF50',
              color: '#fff',
              cursor: 'pointer'
            }}
            onClick={startLearning}
          >
            开始学习
          </button>
        </div>
      ) : (
        <>
          
          {/* 进度条和积分显示 */}
          <div style={{ margin: '20px auto', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <p style={{ margin: '5px 0' }}>今日计划：{dailyPlan} 个单词</p>
                <p style={{ margin: '5px 0' }}>今日已完成：{completedToday} 个单词</p>
                {completedToday >= dailyPlan && wrongWords.length > 0 && !isDailyGoalCompleted && (
                  <p style={{ margin: '5px 0', color: '#ff6b6b', fontWeight: 'bold' }}>
                    要把错题也消灭完才算完成计划哦
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '5px 0' }}>总积分：{totalPoints}</p>
                {isDailyGoalCompleted && (
                  <p style={{ margin: '5px 0', color: '#4CAF50', fontWeight: 'bold' }}>
                    🎉 今日计划已完成！
                  </p>
                )}
              </div>
            </div>
            
            {/* 进度条 */}
            <div style={{
              width: '100%',
              height: '20px',
              backgroundColor: '#f0f0f0',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              <div style={{
                width: `${Math.min((completedToday / dailyPlan) * 100, 100)}%`,
                height: '100%',
                backgroundColor: isDailyGoalCompleted ? '#4CAF50' : '#2196F3',
                borderRadius: '10px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          
          <div style={{ margin: '10px' }}>
            {isDailyGoalCompleted && showShareButton && (
              <button 
                style={{
                  margin: '10px',
                  padding: '10px 20px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  backgroundColor: '#2196F3',
                  color: '#fff',
                  cursor: 'pointer'
                }}
                onClick={shareLearningResult}
              >
                分享学习成果
              </button>
            )}
            <button 
              style={{
                margin: '10px',
                padding: '10px 20px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: '#4CAF50',
                color: '#fff',
                cursor: 'pointer'
              }}
              onClick={() => setShowWrongWords(!showWrongWords)}
            >
              查看错题本 ({wrongWords.length})
            </button>
            <button 
              style={{
                margin: '10px',
                padding: '10px 20px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: '#FF9800',
                color: '#fff',
                cursor: 'pointer'
              }}
              onClick={() => setShowUnfamiliarWords(!showUnfamiliarWords)}
            >
              查看不熟练单词 ({unfamiliarWords.length})
            </button>
            <button 
              style={{
                margin: '10px',
                padding: '10px 20px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: '#9C27B0',
                color: '#fff',
                cursor: 'pointer'
              }}
              onClick={() => setShowQueues(!showQueues)}
            >
              查看队列状态
            </button>
            <button 
              style={{
                margin: '10px',
                padding: '10px 20px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: '#2196F3',
                color: '#fff',
                cursor: 'pointer'
              }}
              onClick={handleReset}
            >
              重新开始
            </button>
            <button 
              style={{
                margin: '10px',
                padding: '10px 20px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: '#607D8B',
                color: '#fff',
                cursor: 'pointer'
              }}
              onClick={() => setShowPlanPage(true)}
            >
              调整计划
            </button>
          </div>
          
          {showUnfamiliarWords && (
            <div style={{
              margin: '20px auto',
              padding: '20px',
              maxWidth: '600px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <h3>不熟练单词</h3>
              {unfamiliarWords.length === 0 ? (
                <p>暂无不熟练单词，继续加油！</p>
              ) : (
                <ul style={{ textAlign: 'left' }}>
                  {unfamiliarWords.map((word, index) => (
                    <li key={index} style={{ margin: '10px 0' }}>
                      <strong>{word.word}</strong>: {word.meaning}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {showQueues && (
            <div style={{
              margin: '20px auto',
              padding: '20px',
              maxWidth: '800px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <h3>队列状态</h3>
              <div style={{ margin: '10px 0' }}>
                <h4>mainQueue ({mainQueue.length}):</h4>
                <p>{mainQueue.map(w => w.word).join(', ')}</p>
              </div>
              <div style={{ margin: '10px 0' }}>
                <h4>reviewQueue ({reviewQueue.length}):</h4>
                <p>{reviewQueue.map(w => w.word).join(', ')}</p>
              </div>
              <div style={{ margin: '10px 0' }}>
                <h4>retryBuffer ({retryBuffer.length}):</h4>
                <p>{retryBuffer.map(w => w.word).join(', ')}</p>
              </div>
              <div style={{ margin: '10px 0' }}>
                <h4>wrongWords ({wrongWords.length}):</h4>
                <p>{wrongWords.map(w => w.word).join(', ')}</p>
              </div>
            </div>
          )}
          
          {showWrongWords && (
            <div style={{
              margin: '20px auto',
              padding: '20px',
              maxWidth: '600px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <h3>错题本</h3>
              {wrongWords.length === 0 ? (
                <p>暂无错题，继续加油！</p>
              ) : (
                <ul style={{ textAlign: 'left' }}>
                  {wrongWords.map((word, index) => (
                    <li key={index} style={{ margin: '10px 0' }}>
                      <strong>{word.word}</strong>: {word.meaning}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {isCompleted ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h2>🎉 恭喜！今日单词已掌握！</h2>
              <p>正确：{correctCount} 个</p>
              <p>错误：{wrongCount} 个</p>
              <p>今日得分：{totalPoints} 分</p>
              {showShareButton && (
                <button 
                  style={{
                    margin: '20px',
                    padding: '15px 30px',
                    fontSize: '18px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    backgroundColor: '#2196F3',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                  onClick={shareLearningResult}
                >
                  分享学习成果
                </button>
              )}
              <button 
                style={{
                  margin: '20px',
                  padding: '15px 30px',
                  fontSize: '18px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  backgroundColor: '#4CAF50',
                  color: '#fff',
                  cursor: 'pointer'
                }}
                onClick={handleReset}
              >
                再来一次
              </button>
            </div>
          ) : currentWord ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '32px', marginRight: '10px' }}>
                  {currentWord.word}
                </h2>
                <button 
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => {
                    // 防止多次点击重叠发音
                    speechSynthesis.cancel();
                    
                    const utterance = new SpeechSynthesisUtterance(currentWord.word);
                    utterance.lang = 'en-US'; // 设为美式英语
                    utterance.rate = 1.0; // 语速（1.0 正常）
                    utterance.pitch = 1.0; // 音调
                    
                    speechSynthesis.speak(utterance);
                  }}
                >
                  🎧
                </button>
              </div>
              <div>
                {options.map((option, index) => (
                  <button
                    key={index}
                    style={getOptionStyle(option)}
                    onClick={() => handleAnswerWithPoints(option)}
                    disabled={answered}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '20px', fontSize: '16px' }}>
                正确：{correctCount} | 错误：{wrongCount}
              </div>
            </div>
          ) : (
            <div>加载中...</div>
          )}
        </>
      )}
    </div>
  );
}

export default App;