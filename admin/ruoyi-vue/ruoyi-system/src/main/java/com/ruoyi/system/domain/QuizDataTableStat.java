package com.ruoyi.system.domain;

import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 数据中心表统计对象
 */
public class QuizDataTableStat extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    private String tableName;

    private String displayName;

    private Long recordCount;

    private String description;

    private String routePath;

    private String routeLabel;

    public String getTableName()
    {
        return tableName;
    }

    public void setTableName(String tableName)
    {
        this.tableName = tableName;
    }

    public String getDisplayName()
    {
        return displayName;
    }

    public void setDisplayName(String displayName)
    {
        this.displayName = displayName;
    }

    public Long getRecordCount()
    {
        return recordCount;
    }

    public void setRecordCount(Long recordCount)
    {
        this.recordCount = recordCount;
    }

    public String getDescription()
    {
        return description;
    }

    public void setDescription(String description)
    {
        this.description = description;
    }

    public String getRoutePath()
    {
        return routePath;
    }

    public void setRoutePath(String routePath)
    {
        this.routePath = routePath;
    }

    public String getRouteLabel()
    {
        return routeLabel;
    }

    public void setRouteLabel(String routeLabel)
    {
        this.routeLabel = routeLabel;
    }
}
