import React, { useState, useEffect, useRef } from 'react';
import wordsData from './data/words.json';
import useQuizLogic, { QUESTION_TYPES } from './useQuizLogic';

function App() {
  const [showWrongWords, setShowWrongWords] = useState(false);
  const [showQueues, setShowQueues] = useState(false);
  const [showPlanPage, setShowPlanPage] = useState(true);
  const [dailyPlan, setDailyPlan] = useState(5);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isDailyGoalCompleted, setIsDailyGoalCompleted] = useState(false);
  const [completionTime, setCompletionTime] = useState(null);
  const [showShareButton, setShowShareButton] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [masteredWords, setMasteredWords] = useState(new Set()); // 总体已掌握单词，初始为空Set
  const [totalMasteredCount, setTotalMasteredCount] = useState(0); // 总掌握单词数
  const [todayMasteredSet, setTodayMasteredSet] = useState(new Set()); // 今日已掌握单词，初始为空Set
  const [lastVisitDate, setLastVisitDate] = useState(''); // 上次访问日期
  const [isLearningStarted, setIsLearningStarted] = useState(false); // 学习状态标记，未开始学习时为false
  const [randomEmojiImage, setRandomEmojiImage] = useState(''); // 随机显示的emoji图片路径
  const shareRef = useRef(null);

  // 使用自定义 Hook 管理答题逻辑
  const {
    currentWord,
    currentQuestionType,
    currentQuestionData,
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
    questionTypesQueue,
    playPronunciation,
    masteredWordCount, // 导入已掌握的单词数
    QUESTION_TYPES: qt
  } = useQuizLogic(wordsData);

  // 随机选择 emoji 图片
  useEffect(() => {
    // 定义 emoji 目录中的图片文件名数组
    const emojiImages = [
      "微信图片_20260211030903_28_26.jpg",
      "微信图片_20260211030903_29_26.jpg",
      "微信图片_20260211030904_30_26.jpg",
      "微信图片_20260211030905_31_26.jpg",
      "微信图片_20260211030906_32_26.jpg",
      "微信图片_20260211030907_33_26.jpg",
      "微信图片_20260211030907_34_26.jpg",
      "微信图片_20260211030908_35_26.jpg",
      "微信图片_20260211030909_36_26.jpg",
      "微信图片_20260211030910_37_26.jpg",
      "微信图片_20260211030911_38_26.jpg"
    ];
    
    // 随机选择一张图片
    const randomIndex = Math.floor(Math.random() * emojiImages.length);
    const randomImage = emojiImages[randomIndex];
    
    // 设置随机图片路径
    setRandomEmojiImage(`/emoji/${randomImage}`);
  }, []);

  // 使用 masteredWordCount 更新今日完成进度
  useEffect(() => {
    setCompletedToday(masteredWordCount);
    
    // 从 localStorage 读取总掌握数并更新
    const storedTotalMastered = parseInt(localStorage.getItem('totalMasteredCount') || '0', 10);
    setTotalMasteredCount(storedTotalMastered);

  }, [masteredWordCount]);

  useEffect(() => {
    // 将总掌握数存储到 localStorage
    localStorage.setItem('totalMasteredCount', totalMasteredCount);
  }, [totalMasteredCount]);

  // 每日重置逻辑
  useEffect(() => {
    const today = new Date().toDateString();
    
    // 从localStorage获取上次访问日期和今日已掌握单词
    const storedLastVisitDate = localStorage.getItem('lastVisitDate');
    const storedTodayMastered = localStorage.getItem('todayMastered');
    
    // 计划页（showPlanPage 为 true）时强制重置 todayMasteredSet 和 completedToday 为0
    if (showPlanPage) {
      setTodayMasteredSet(new Set());
      setCompletedToday(0);
      return;
    }
    
    if (storedLastVisitDate !== today) {
      // 新的一天，重置今日已掌握单词
      setTodayMasteredSet(new Set());
      setCompletedToday(0);
      setLastVisitDate(today);
      localStorage.setItem('lastVisitDate', today);
      localStorage.setItem('todayMastered', JSON.stringify([]));
    } else {
      // 同一天，恢复今日已掌握单词
      // 仅当 isLearningStarted 为 true 才读取 localStorage，否则强制重置为0
      if (isLearningStarted && storedTodayMastered) {
        try {
          const todayMasteredArray = JSON.parse(storedTodayMastered);
          setTodayMasteredSet(new Set(todayMasteredArray));
          setCompletedToday(todayMasteredArray.length);
        } catch (error) {
          console.error('Failed to parse todayMastered from localStorage:', error);
          setTodayMasteredSet(new Set());
          setCompletedToday(0);
        }
      } else {
        // 如果没有存储的今日已掌握单词，或者学习尚未开始，设置为空Set
        setTodayMasteredSet(new Set());
        setCompletedToday(0);
      }
      setLastVisitDate(today);
    }
  }, [showPlanPage, isLearningStarted]);



  // 检查是否完成每日目标
  const checkDailyGoalCompletion = () => {
    if (completedToday >= dailyPlan && retryBuffer.length === 0 && !isDailyGoalCompleted) {
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
  }, [completedToday, retryBuffer, dailyPlan, isDailyGoalCompleted, checkDailyGoalCompletion]);

  // 处理答题，添加积分和进度计算
  const handleAnswerWithPoints = (answer) => {
    const currentWordToCheck = currentWord;
    
    // 调用 handleAnswer 并获取是否答对的返回值
    const isCorrect = handleAnswer(answer);
    
    // 直接基于返回值更新积分
    if (isCorrect) {
      // 答对了，增加积分
      const pointsEarned = isDailyGoalCompleted ? 3.75 : 2.5;
      setTotalPoints(prev => prev + pointsEarned);
    }
    
    // 检查是否完成每日目标
    checkDailyGoalCompletion();
  };

  // 开始学习
  const startLearning = () => {
    setShowPlanPage(false);
    setIsDailyGoalCompleted(false);
    setTotalPoints(0);
    setUserInput('');
    setIsLearningStarted(true);
    initialize();
  };

  // 重置学习
  const handleReset = () => {
    initialize();
    setTotalPoints(0);
    setIsDailyGoalCompleted(false);
    setCompletionTime(null);
    setShowShareButton(false);
    setUserInput('');
    setIsLearningStarted(false);
    setMasteredWords(new Set());
    setTodayMasteredSet(new Set());
    setCompletedToday(0);
    // setTotalMasteredCount(0); // 重置时不再归零总数
    // localStorage.removeItem('totalMasteredCount');
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
    
    let isCorrect = false;
    switch (currentQuestionType) {
      case qt.CHINESE_TO_ENGLISH:
        isCorrect = option === currentWord.word;
        break;
      case qt.MEANING_TO_WORD:
        isCorrect = option === currentWord.meaning;
        break;
    }
    
    if (isCorrect) {
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

  // 获取题型名称
  const getQuestionTypeName = (type) => {
    switch (type) {
      case qt.SPELL:
        return '听音拼写';
      case qt.FILL:
        return '填空补全';
      case qt.CHINESE_TO_ENGLISH:
        return '中文选英文';
      case qt.MEANING_TO_WORD:
        return '英文选中文';
      default:
        return '未知题型';
    }
  };

  return (
    <div className="app">
      {showPlanPage ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h1 style={{ fontFamily: 'SimHei, sans-serif', color: '#000', fontWeight: 'bold' }}>王舒龙该记单词了！</h1>
          <img 
            src={randomEmojiImage || "/1770535425292_d.jpg"} 
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
          
          {/* 记忆进度条 */}
          <div style={{ margin: '20px auto', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <p style={{ margin: '5px 0' }}>今天计划掌握 {dailyPlan} 个单词，已完成 {completedToday} 个</p>
                <p style={{ margin: '5px 0' }}>全部 {wordsData.length} 个单词，已掌握 {totalMasteredCount} 个</p>
                {completedToday >= dailyPlan && retryBuffer.length > 0 && !isDailyGoalCompleted && (
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
            
            {/* 今日计划进度条 */}
            <div style={{
              width: '100%',
              height: '20px',
              backgroundColor: '#f0f0f0',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '10px'
            }}>
              <div style={{
                width: `${Math.min((completedToday / dailyPlan) * 100, 100)}%`,
                height: '100%',
                backgroundColor: isDailyGoalCompleted ? '#4CAF50' : '#2196F3',
                borderRadius: '10px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            
            {/* 全部单词进度条 */}
            <div style={{
              width: '100%',
              height: '20px',
              backgroundColor: '#f0f0f0',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              <div style={{
                width: `${Math.min((totalMasteredCount / wordsData.length) * 100, 100)}%`,
                height: '100%',
                backgroundColor: '#9C27B0',
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
              查看错题本 ({retryBuffer.length})
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
                <ul style={{ textAlign: 'left' }}>
                  {retryBuffer.map((item, index) => (
                    <li key={index} style={{ margin: '5px 0' }}>
                      <strong>{item.word.word}</strong>: {item.word.meaning} 
                      (错: {item.failedTypes.map(getQuestionTypeName).join(', ')})
                    </li>
                  ))}
                </ul>
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
              {retryBuffer.length === 0 ? (
                <p>暂无错题，继续加油！</p>
              ) : (
                <ul style={{ textAlign: 'left' }}>
                  {retryBuffer.map((item, index) => (
                    <li key={index} style={{ margin: '10px 0' }}>
                      <strong>{item.word.word}</strong>: {item.word.meaning}
                      <br />
                      <small style={{ color: '#666' }}>
                        错误题型: {item.failedTypes.map(getQuestionTypeName).join(', ')}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {isCompleted ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h2>🎉 恭喜！今日单词已掌握！</h2>
              <p>正确：{Math.floor(correctCount / 4)} 个单词</p>
              <p>错误：{wrongCount} 题</p>
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
              <h3 style={{ marginBottom: '20px' }}>
                题型：{getQuestionTypeName(currentQuestionType)}
              </h3>
              
              {currentQuestionType === qt.SPELL && (
                <div style={{ marginBottom: '30px' }}>
                  <h4>请听发音并拼写完整单词：</h4>
                  <div style={{ margin: '20px 0' }}>
                    <button 
                      style={{
                        padding: '10px 20px',
                        fontSize: '18px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        backgroundColor: '#f0f0f0',
                        cursor: 'pointer',
                        marginRight: '10px'
                      }}
                      onClick={() => playPronunciation(currentWord.word)}
                    >
                      🎧 播放发音
                    </button>
                  </div>
                  <div style={{ margin: '20px 0' }}>
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !answered) {
                          handleAnswerWithPoints(userInput);
                          setUserInput('');
                        }
                      }}
                      disabled={answered}
                      style={{
                        padding: '10px',
                        fontSize: '18px',
                        width: '200px',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                      }}
                      placeholder="请输入完整单词"
                    />
                    <button
                      style={{
                        marginLeft: '10px',
                        padding: '10px 20px',
                        fontSize: '16px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        backgroundColor: '#4CAF50',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        handleAnswerWithPoints(userInput);
                        setUserInput('');
                      }}
                      disabled={answered}
                    >
                      提交
                    </button>
                  </div>
                </div>
              )}
              
              {currentQuestionType === qt.FILL && (
                <div style={{ marginBottom: '30px' }}>
                  <h4>请补全单词：</h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <p style={{ fontSize: '24px', margin: '20px 0' }}>
                      {currentQuestionData.template}  
                      <span style={{ fontSize: '18px', color: '#666' }}>
                        ({currentWord.meaning})
                      </span>
                    </p>
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
                        justifyContent: 'center',
                        marginLeft: '10px'
                      }}
                      onClick={() => playPronunciation(currentWord.word)}
                    >
                      🎧
                    </button>
                  </div>
                  <div style={{ margin: '20px 0' }}>
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !answered) {
                          handleAnswerWithPoints(userInput);
                          setUserInput('');
                        }
                      }}
                      disabled={answered}
                      style={{
                        padding: '10px',
                        fontSize: '18px',
                        width: '150px',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                      }}
                      placeholder="请输入缺失字母"
                    />
                    <button
                      style={{
                        marginLeft: '10px',
                        padding: '10px 20px',
                        fontSize: '16px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        backgroundColor: '#4CAF50',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        handleAnswerWithPoints(userInput);
                        setUserInput('');
                      }}
                      disabled={answered}
                    >
                      提交
                    </button>
                  </div>
                </div>
              )}
              
              {currentQuestionType === qt.CHINESE_TO_ENGLISH && (
                <div style={{ marginBottom: '30px' }}>
                  <h4>请选择正确的英文单词：</h4>
                  <p style={{ fontSize: '24px', margin: '20px 0' }}>
                    {currentWord.meaning}
                  </p>
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
                </div>
              )}
              
              {currentQuestionType === qt.MEANING_TO_WORD && (
                <div style={{ marginBottom: '30px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
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
                      onClick={() => playPronunciation(currentWord.word)}
                    >
                      🎧
                    </button>
                  </div>
                  <h4>请选择正确的中文意思：</h4>
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
                </div>
              )}
              
              <div style={{ marginTop: '20px', fontSize: '16px' }}>
                正确：{Math.floor(correctCount / 4)} 个单词 | 错误：{wrongCount} 题
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