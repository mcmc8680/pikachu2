# 部署
# 設定properties  123
在liferay目錄底下創建一個portal-ext.properties，設定參數讓html以inline方式開啟(預設是download)

    mime.types.content.disposition.inline=html

# 設定Document Type  
在document and media的Manage下的document types新增一個名稱為Reveal(大小寫皆可)的type，之後以該type上傳即可


# 程式設定(for programmer)
# 設定相關xml

1 設定portlet.xml  
在\<portlet>裡加入下面的init，其中value為configuration page的存放位置


    <init-param>
        <name>config-template</name>
        <value>/html/revealConfig/config.jsp</value>
    </init-param>
    
2 設定liferay-portlet.xml  
在\<portlet>底下的\<icon>後加入自定義的configuration action class

    <configuration-action-class>revealConfig.ConfigurationAction</configuration-action-class>
    
# 新增configuration action class  
將class extends DefaultConfigurationAction，並override processAction，設計submit後的處理


    public class ConfigurationAction extends DefaultConfigurationAction {
	
        @Override
        public void processAction(
            PortletConfig portletConfig, ActionRequest actionRequest,
            ActionResponse actionResponse) throws Exception {
        }
    }
            
# JSP  

### 定義configuration頁面的actionURL

    <liferay-portlet:actionURL portletConfiguration="true" var="configurationURL" />
### 使用

    <aui:form action="<%= configurationURL %>" method="post">
    
# Preference  
preference對portlet來講是一個全域的變數，一位使用者更動後會影響所有使用者，用來做為整體設定的參數儲存。  

### set
方法有兩種，一種是用liferay定義的方式，一種為手動產生。  
1 使用liferay  
在JSP的form內加入該行程式碼 

    <aui:input name="<%= Constants.CMD %>" type="hidden" value="<%= Constants.UPDATE %>" />
並將要儲存成preference的input的name格式設定為preferences--PreferenceKey--，以下是範例

    <aui:input name="preferences--MyPreference--" type="checkbox" />
    
之後將configuration action class內的processAction加入

    super.processAction(portletConfig, actionRequest, actionResponse);
    
這樣liferay就會自動將input的value存入preference，且將key設定為MyPreference

2 使用java  
首先取得PortletPreferences 

    String portletResource = ParamUtil.getString(request, "portletResource");
    if (Validator.isNotNull(portletResource)) {
        PortletPreferences prefs = PortletPreferencesFactoryUtil.getPortletSetup(request, portletResource);
    }
    
然後設定要儲存的資料

    prefs.setValue(key, String);
    prefs.setValues(key, String[]);
    
之後儲存

    prefs.store();
    
### get
1 JSP  
在JSP內使用下列程式碼取得參數，其中initValue為取得null時的數值

    <% String preference = portletPreferences.getValue(key, initValue); %>
    <% String[] preferences = portletPreferences.getValues(key, initValue); %>
    
2 Java  
同樣先取得PortletPreference

    String portletResource = ParamUtil.getString(request, "portletResource");
    if (Validator.isNotNull(portletResource)) {
        PortletPreferences prefs = PortletPreferencesFactoryUtil.getPortletSetup(request, portletResource);
    }
然後get

    String preference = prefs.getValue(key, initValue);
    String[] preferences = prefs.getValues(key, initValue);
    
# 參考資料  
https://dev.liferay.com/develop/tutorials/-/knowledge_base/6-2/using-configurable-portlet-preferences
